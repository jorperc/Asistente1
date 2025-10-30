
import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Message } from '../types';
import { UserIcon } from './icons/UserIcon';
import { BotIcon } from './icons/BotIcon';
import { SendIcon } from './icons/SendIcon';
import { MicrophoneIcon } from './icons/MicrophoneIcon';
import { SpeakerIcon } from './icons/SpeakerIcon';

interface ChatWindowProps {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  onSendMessage: (text: string) => void;
  onTextToSpeech: (text: string) => void;
}

// FIX: Cast window to any to access non-standard SpeechRecognition APIs and prevent TypeScript errors.
const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
const isSpeechRecognitionSupported = !!SpeechRecognition;

export const ChatWindow: React.FC<ChatWindowProps> = ({ messages, isLoading, onSendMessage, onTextToSpeech }) => {
  const [inputValue, setInputValue] = useState('');
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  // FIX: Use `any` for the recognition ref type as SpeechRecognition is a value, not a standard type.
  const recognitionRef = useRef<any | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages, isLoading]);

  useEffect(() => {
    if (!isSpeechRecognitionSupported) {
      console.warn("Speech recognition not supported by this browser.");
      return;
    }
    
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'es-ES';
    recognition.interimResults = false;

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInputValue(transcript);
    };
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
    }
    
    recognitionRef.current = recognition;

    return () => {
        recognition.stop();
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !isLoading) {
      onSendMessage(inputValue);
      setInputValue('');
    }
  };

  const handleMicClick = () => {
    if (isLoading || !recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900">
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((msg, index) => {
          if (msg.sender === 'user') {
            return (
              <div key={index} className="flex items-start gap-4 justify-end">
                <div className="max-w-xl p-4 rounded-2xl shadow-md bg-cyan-600 rounded-br-none markdown-content text-white">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown>
                </div>
                <UserIcon />
              </div>
            );
          } else { // sender === 'bot'
            return (
              <div key={index} className="flex items-start gap-4 justify-start">
                <BotIcon />
                <div className="flex items-end gap-2">
                  <div className="max-w-xl p-4 rounded-2xl shadow-md bg-slate-700 rounded-bl-none markdown-content">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown>
                  </div>
                  <button
                    onClick={() => onTextToSpeech(msg.text)}
                    className="p-2 rounded-full text-slate-400 hover:bg-slate-700 hover:text-cyan-400 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 mb-1"
                    aria-label="Leer en voz alta"
                  >
                    <SpeakerIcon />
                  </button>
                </div>
              </div>
            );
          }
        })}
        {isLoading && (
          <div className="flex items-start gap-4 justify-start">
            <BotIcon />
            <div className="max-w-xl p-4 rounded-2xl bg-slate-700 rounded-bl-none">
              <div className="flex items-center space-x-2">
                <div className="w-2.5 h-2.5 bg-cyan-400 rounded-full animate-pulse"></div>
                <div className="w-2.5 h-2.5 bg-cyan-400 rounded-full animate-pulse [animation-delay:0.2s]"></div>
                <div className="w-2.5 h-2.5 bg-cyan-400 rounded-full animate-pulse [animation-delay:0.4s]"></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-slate-800 border-t border-slate-700">
        <form onSubmit={handleSubmit} className="flex items-center gap-4">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Escribe tu pregunta o usa el micrófono..."
            disabled={isLoading}
            className="flex-1 w-full bg-slate-700 text-gray-200 placeholder-slate-400 rounded-full py-3 px-5 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition duration-300 disabled:opacity-50"
          />
          {isSpeechRecognitionSupported && (
            <button
                type="button"
                onClick={handleMicClick}
                disabled={isLoading}
                className={`p-3 rounded-full transition duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 disabled:cursor-not-allowed ${isListening ? 'bg-red-500 hover:bg-red-600 focus:ring-red-400 animate-pulse' : 'bg-slate-600 hover:bg-slate-500 focus:ring-cyan-400'}`}
                aria-label={isListening ? 'Detener grabación' : 'Grabar audio'}
            >
                <MicrophoneIcon />
            </button>
          )}
          <button
            type="submit"
            disabled={isLoading || !inputValue.trim()}
            className="bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-full p-3 transition duration-300 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-800"
            aria-label="Enviar mensaje"
          >
            <SendIcon />
          </button>
        </form>
      </div>
    </div>
  );
};