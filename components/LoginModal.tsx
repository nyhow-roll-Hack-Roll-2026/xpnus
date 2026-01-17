import React, { useState, useRef } from 'react';
import { Upload } from 'lucide-react';
import { MinecraftButton } from './MinecraftButton';
import { PixelatedCanvas } from './ui/pixelated-canvas';
import { AVATARS } from '../constants';

interface Props {
    onLogin: (username: string, avatarUrl: string, isCustomAvatar: boolean) => void;
}

export const LoginModal: React.FC<Props> = ({ onLogin }) => {
    const [username, setUsername] = useState('');
    const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0]);
    const [isCustom, setIsCustom] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isShaking, setIsShaking] = useState(false);
    const [error, setError] = useState('');

    const fileInputRef = useRef<HTMLInputElement>(null);

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
        onLogin(username, selectedAvatar, isCustom);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Check size (limit to 2MB for localStorage safety in this demo)
            if (file.size > 2 * 1024 * 1024) {
                setError("File is too large! Max 2MB.");
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                setSelectedAvatar(result);
                setIsCustom(true);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSelectDefault = (url: string) => {
        setSelectedAvatar(url);
        setIsCustom(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950 bg-grid-pattern">
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
                    <h1 className="text-6xl text-gray-800 font-bold absolute top-1 left-1 w-full select-none opacity-50">NUS CRAFT</h1>
                    <h1 className="text-6xl text-white font-bold relative z-10 select-none drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">NUS CRAFT</h1>
                    <p className="text-yellow-400 mt-2 animate-bounce text-xl tracking-wider">Surviving the Bell Curve!</p>
                </div>

                <div className="bg-slate-900/80 backdrop-blur-md border border-white/20 p-8 shadow-[0_0_30px_rgba(0,0,0,0.5)] rounded-lg">
                    <form onSubmit={handleSubmit} className="space-y-6">

                        {/* Avatar Selection */}
                        <div className="flex flex-col items-center gap-4">
                            <div className="relative group">
                                <div className="border border-white/20 bg-black/50 rounded-lg overflow-hidden p-1">
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

                            <div className="flex flex-col gap-2 items-center w-full">
                                <div className="flex gap-2 justify-center">
                                    {AVATARS.map((url, i) => (
                                        <button
                                            key={i}
                                            type="button"
                                            onClick={() => handleSelectDefault(url)}
                                            className={`w-10 h-10 border-2 rounded ${selectedAvatar === url && !isCustom ? 'border-green-500 bg-white/10' : 'border-gray-700 bg-black/40'} hover:border-gray-400 transition-colors`}
                                        >
                                            <img src={url} alt="avatar option" className="w-full h-full pixelated" />
                                        </button>
                                    ))}
                                </div>

                                <div className="flex items-center gap-2 w-full justify-center border-t border-white/10 pt-2 mt-1">
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleFileUpload}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className={`flex items-center gap-2 text-sm px-3 py-1 rounded transition-colors ${isCustom ? 'bg-green-900/50 text-green-300 border border-green-500' : 'bg-white/5 text-gray-400 hover:text-white border border-transparent hover:border-white/20'}`}
                                    >
                                        <Upload size={14} />
                                        {isCustom ? 'Custom Skin Loaded' : 'Upload Custom Skin'}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Username Input */}
                        <div>
                            <label className="block text-gray-300 mb-2 text-xl tracking-wide">Username</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => {
                                    setUsername(e.target.value);
                                    if (error) setError('');
                                }}
                                className={`w-full bg-black/50 text-white border p-3 font-pixel text-xl focus:outline-none placeholder-gray-600 rounded ${error ? 'border-red-500 animate-pulse' : 'border-gray-700 focus:border-white/50'}`}
                                placeholder="Steve"
                                maxLength={12}
                            />
                            {error && <p className="text-red-400 mt-1 text-lg">{error}</p>}
                        </div>

                        <div style={{ animation: isShaking ? 'shake 0.5s cubic-bezier(.36,.07,.19,.97) both' : 'none' }}>
                            <MinecraftButton
                                type="submit"
                                className="w-full h-14 text-2xl shadow-lg"
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