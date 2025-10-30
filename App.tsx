import React, { useState, useCallback, useRef } from 'react';
import { Avatar } from './components/Avatar';
import { ChatWindow } from './components/ChatWindow';
import { getChatbotResponse, getTextToSpeechResponse } from './services/geminiService';
import { Message } from './types';
import { decode, decodeAudioData } from './utils/audioUtils';
import { ApiKeyModal } from './components/ApiKeyModal';

const API_KEY_STORAGE_KEY = 'gemini-api-key';

const App: React.FC = () => {
  const [apiKey, setApiKey] = useState<string | null>(() => localStorage.getItem(API_KEY_STORAGE_KEY));
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'bot',
      text: '¡Hola! Soy tu asistente virtual. ¿Qué te gustaría saber sobre la evaluación de secundaria en Castilla y León?',
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const audioQueueRef = useRef<string[]>([]);
  const isPlayingRef = useRef(false);
  const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);

  const handleSaveApiKey = (key: string) => {
    localStorage.setItem(API_KEY_STORAGE_KEY, key);
    setApiKey(key);
    setMessages([
      {
        sender: 'bot',
        text: '¡Gracias! Tu clave de API ha sido guardada. Ahora puedes empezar a chatear.',
      },
    ]);
  };

  const playAudio = useCallback(async () => {
    if (!apiKey) return;
    if (isPlayingRef.current || audioQueueRef.current.length === 0) {
      if(audioQueueRef.current.length === 0) {
        setIsSpeaking(false);
      }
      return;
    }

    isPlayingRef.current = true;
    setIsSpeaking(true);
    const textToPlay = audioQueueRef.current.shift();

    if (!textToPlay) {
      setIsSpeaking(false);
      isPlayingRef.current = false;
      return;
    }

    try {
      const base64Audio = await getTextToSpeechResponse(textToPlay, apiKey);
      
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }
      const audioContext = audioContextRef.current;
      
      const decodedData = decode(base64Audio);
      const audioBuffer = await decodeAudioData(decodedData, audioContext, 24000, 1);
      
      const source = audioContext.createBufferSource();
      currentSourceRef.current = source;
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      source.onended = () => {
        currentSourceRef.current = null;
        isPlayingRef.current = false;
        playAudio(); // Check for more audio in the queue
      };
      source.start();

    } catch (err) {
      console.error("Error playing audio:", err);
      const errorMessage = err instanceof Error ? err.message : 'Error al reproducir el audio.';
      const botErrorMessage: Message = { sender: 'bot', text: errorMessage };
      setMessages((prevMessages) => [...prevMessages, botErrorMessage]);
      isPlayingRef.current = false;
      playAudio(); // Continue with next item in queue even if one fails
    }
  }, [apiKey]);
  
  const handleTextToSpeech = useCallback((text: string) => {
    if (!apiKey) return;
    // Stop any currently playing audio and clear the queue
    if (currentSourceRef.current) {
        currentSourceRef.current.onended = null; // Prevent onended from triggering playAudio again
        currentSourceRef.current.stop();
        currentSourceRef.current = null;
    }
    audioQueueRef.current = [];
    isPlayingRef.current = false;
    setIsSpeaking(false);

    // Queue and play the new text
    audioQueueRef.current.push(text);
    playAudio();
  }, [playAudio, apiKey]);

  const handleSendMessage = useCallback(async (text: string) => {
    if (!text.trim()) return;
    if (!apiKey) {
      setError('Por favor, introduce tu clave de API para continuar.');
      return;
    }

    const userMessage: Message = { sender: 'user', text };
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      const botResponseText = await getChatbotResponse(text, apiKey);
      const botMessage: Message = { sender: 'bot', text: botResponseText };
      setMessages((prevMessages) => [...prevMessages, botMessage]);
      audioQueueRef.current.push(botResponseText);
      playAudio();

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Lo siento, ha ocurrido un error desconocido.';
      setError(errorMessage);
      const botErrorMessage: Message = { sender: 'bot', text: errorMessage };
      setMessages((prevMessages) => [...prevMessages, botErrorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [apiKey, playAudio]);

  if (!apiKey) {
    return <ApiKeyModal onSave={handleSaveApiKey} />;
  }

  return (
    <div className="flex flex-col md:flex-row h-screen font-sans bg-slate-900 text-gray-200">
      <div className="md:w-1/3 w-full h-1/3 md:h-full bg-slate-800 flex flex-col items-center justify-center p-6 border-r border-slate-700 shadow-lg">
        <Avatar isSpeaking={isSpeaking} />
        <h1 className="text-2xl lg:text-3xl font-bold mt-4 text-cyan-400 text-center">Asistente de Innovación Docente</h1>
        <p className="text-slate-400 mt-2 text-center text-sm lg:text-base">Impulsado por la Universidad de León</p>
      </div>
      <div className="md:w-2/3 w-full h-2/3 md:h-full flex flex-col">
        <ChatWindow
          messages={messages}
          isLoading={isLoading}
          error={error}
          onSendMessage={handleSendMessage}
          onTextToSpeech={handleTextToSpeech}
        />
      </div>
    </div>
  );
};

export default App;