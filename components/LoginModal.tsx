import React, { useState } from 'react';
import { MinecraftButton } from './MinecraftButton';
import { PixelatedCanvas } from './ui/pixelated-canvas';
import { AVATARS } from '../constants';

interface Props {
  onLogin: (username: string, avatarUrl: string) => void;
}

export const LoginModal: React.FC<Props> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0]);
  const [loading, setLoading] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!username.trim()) {
        setIsShaking(true);
        setError('Please enter a username to start!');
        setTimeout(() => setIsShaking(false), 500);
        return;
    }
    
    setLoading(true);
    onLogin(username, selectedAvatar);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] bg-[#252525]">
      <style>{`
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
            20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
      `}</style>
      <div className="w-full max-w-md p-1">
        
        {/* Minecraft Logo Style Title */}
        <div className="text-center mb-8 relative">
            <h1 className="text-6xl text-[#7e7e7e] font-bold absolute top-1 left-1 w-full select-none">NUS CRAFT</h1>
            <h1 className="text-6xl text-white font-bold relative z-10 select-none drop-shadow-xl">NUS CRAFT</h1>
            <p className="text-mc-yellow mt-2 animate-bounce text-xl">Surviving the Bell Curve!</p>
        </div>

        <div className="bg-[#C6C6C6] border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.5)]">
            <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Avatar Selection */}
                <div className="flex flex-col items-center gap-4">
                    <div className="relative group">
                        <div className="border-4 border-[#373737] bg-black">
                            <PixelatedCanvas 
                                src={selectedAvatar} 
                                width={120} 
                                height={120} 
                                cellSize={4}
                                shape="square"
                                distortionStrength={1.5}
                                distortionRadius={40}
                                distortionMode="repel"
                                dropoutStrength={0.05}
                                jitterStrength={2}
                                jitterSpeed={0.5}
                                followSpeed={0.1}
                            />
                        </div>
                    </div>

                    <div className="flex gap-2 justify-center">
                        {AVATARS.map((url, i) => (
                            <button
                                key={i}
                                type="button"
                                onClick={() => setSelectedAvatar(url)}
                                className={`w-8 h-8 border-2 ${selectedAvatar === url ? 'border-mc-green bg-white' : 'border-[#555] bg-[#8B8B8B]'} hover:bg-white transition-colors`}
                            >
                                <img src={url} alt="avatar option" className="w-full h-full pixelated" />
                            </button>
                        ))}
                    </div>
                </div>

                {/* Username Input */}
                <div>
                    <label className="block text-[#373737] mb-2 text-xl">Username</label>
                    <input 
                        type="text" 
                        value={username}
                        onChange={(e) => {
                            setUsername(e.target.value);
                            if (error) setError('');
                        }}
                        className={`w-full bg-black text-white border-2 p-3 font-pixel text-xl focus:outline-none placeholder-gray-600 ${error ? 'border-red-500 animate-pulse' : 'border-[#555] focus:border-white'}`}
                        placeholder="Steve"
                        maxLength={12}
                    />
                     {error && <p className="text-red-600 mt-1 text-lg">{error}</p>}
                </div>

                <div style={{ animation: isShaking ? 'shake 0.5s cubic-bezier(.36,.07,.19,.97) both' : 'none' }}>
                    <MinecraftButton 
                        type="submit" 
                        className="w-full h-14 text-2xl"
                        variant={loading ? 'disabled' : 'default'}
                        disabled={loading}
                    >
                        {loading ? 'CONNECTING...' : 'ENTER WORLD'}
                    </MinecraftButton>
                </div>
            </form>
        </div>
      </div>
    </div>
  );
};
