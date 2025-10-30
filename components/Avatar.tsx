import React from 'react';

interface AvatarProps {
  isSpeaking: boolean;
}

const IDLE_AVATAR_URL = "https://i.gifer.com/ZNeT.gif";
const TALKING_AVATAR_URL = "https://i.gifer.com/9aJ.gif";


export const Avatar: React.FC<AvatarProps> = ({ isSpeaking }) => {
  return (
    <div className="relative w-40 h-40 lg:w-48 lg:h-48 rounded-full overflow-hidden border-4 border-cyan-500 shadow-2xl shadow-cyan-500/20">
      <img
        src={isSpeaking ? TALKING_AVATAR_URL : IDLE_AVATAR_URL}
        alt="Asistente Virtual Animado"
        className="w-full h-full object-cover"
        key={isSpeaking ? 'talking' : 'idle'}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 to-transparent"></div>
    </div>
  );
};