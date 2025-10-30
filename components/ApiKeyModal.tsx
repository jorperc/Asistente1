import React, { useState } from 'react';
import { KeyIcon } from './icons/KeyIcon';

interface ApiKeyModalProps {
  onSave: (apiKey: string) => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ onSave }) => {
  const [apiKey, setApiKey] = useState('');

  const handleSave = () => {
    if (apiKey.trim()) {
      onSave(apiKey.trim());
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 font-sans">
      <div className="bg-slate-800 rounded-2xl shadow-xl border border-slate-700 p-8 max-w-md w-full mx-4">
        <div className="flex flex-col items-center text-center">
          <div className="p-3 bg-cyan-500/10 rounded-full border border-cyan-500/30">
            <KeyIcon />
          </div>
          <h2 className="text-2xl font-bold text-white mt-4">Clave de API Requerida</h2>
          <p className="text-slate-400 mt-2">
            Para usar este asistente, necesitas una clave de API de Google Gemini.
            La aplicación la guardará de forma segura en tu navegador.
          </p>
          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="text-cyan-400 hover:text-cyan-300 transition-colors mt-2 text-sm"
          >
            Obtén tu clave de API aquí &rarr;
          </a>
        </div>

        <div className="mt-6">
          <label htmlFor="apiKeyInput" className="block text-sm font-medium text-slate-300 mb-2">
            Tu Clave de API de Google
          </label>
          <input
            id="apiKeyInput"
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            placeholder="Pega tu clave aquí..."
            className="w-full bg-slate-700 text-gray-200 placeholder-slate-500 rounded-lg py-3 px-4 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition duration-300"
          />
        </div>

        <div className="mt-6">
          <button
            onClick={handleSave}
            disabled={!apiKey.trim()}
            className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold rounded-lg p-3 transition duration-300 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-800"
          >
            Guardar y Empezar
          </button>
        </div>
      </div>
    </div>
  );
};
