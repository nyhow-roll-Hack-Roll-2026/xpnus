import React, { useState, useEffect } from 'react';
import { X, Search, Users } from 'lucide-react';
import { User } from '../types';
import { searchUsers } from '../services/authService';
import { PixelatedCanvas } from './ui/pixelated-canvas';

interface Props {
  onClose: () => void;
  onSelectUser: (username: string) => void;
  currentUsername: string;
}

export const UserSearchModal: React.FC<Props> = ({ onClose, onSelectUser, currentUsername }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  // Initial load
  useEffect(() => {
    handleSearch('');
  }, []);

  const handleSearch = async (q: string) => {
    setLoading(true);
    try {
        const users = await searchUsers(q);
        setResults(users);
    } catch (e) {
        console.error(e);
    } finally {
        setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setQuery(val);
      handleSearch(val); // Debounce could be added here in real app
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-200">
      
      <div className="relative w-full max-w-2xl bg-[#262626] border-2 border-gray-500 shadow-2xl rounded-sm overflow-hidden flex flex-col h-[70vh]">
            
            {/* Header: Multiplayer Server List Style */}
            <div className="p-4 flex flex-col items-center bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] border-b-2 border-black relative">
                <h2 className="text-xl text-gray-300 font-bold tracking-widest uppercase mb-1 drop-shadow-md">Player Directory</h2>
                <div className="w-full max-w-md relative">
                    <input 
                        type="text" 
                        value={query}
                        onChange={handleInputChange}
                        placeholder="Search username..."
                        className="w-full bg-black border-2 border-[#555] p-2 pl-10 text-white font-pixel focus:outline-none focus:border-white"
                        autoFocus
                    />
                    <Search className="absolute left-3 top-2.5 text-gray-500" size={18} />
                </div>

                <button 
                    onClick={onClose} 
                    className="absolute top-2 right-2 text-gray-500 hover:text-white transition-colors"
                >
                    <X size={24} />
                </button>
            </div>

            {/* User List */}
            <div className="flex-1 overflow-y-auto bg-[#1a1a1a] p-2 space-y-2 relative">
                {loading ? (
                    <div className="text-center text-gray-500 py-10 animate-pulse">Scanning server...</div>
                ) : results.length === 0 ? (
                    <div className="text-center text-gray-600 py-10">No players found.</div>
                ) : (
                    results.map((user) => (
                        <div 
                            key={user.username}
                            onClick={() => onSelectUser(user.username)}
                            className={`
                                group flex items-center gap-4 p-2 border-2 cursor-pointer transition-all hover:bg-white/5
                                ${user.username === currentUsername ? 'border-green-800 bg-green-900/10' : 'border-[#333] hover:border-gray-500'}
                            `}
                        >
                            {/* Avatar */}
                            <div className="relative w-12 h-12 bg-black border border-gray-600 shrink-0">
                                <PixelatedCanvas 
                                    src={user.avatarUrl} 
                                    width={48} 
                                    height={48} 
                                    cellSize={3}
                                    interactive={false} 
                                />
                                {/* Online Status Dot */}
                                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-black rounded-sm"></div>
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-center">
                                    <h3 className={`font-bold text-lg truncate ${user.username === currentUsername ? 'text-green-400' : 'text-gray-200'}`}>
                                        {user.username} {user.username === currentUsername && '(YOU)'}
                                    </h3>
                                    <div className="flex gap-2 text-gray-500 text-xs uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Users size={12} /> View Profile
                                    </div>
                                </div>
                                <p className="text-gray-500 text-sm truncate italic">"{user.bio || 'Player'}"</p>
                            </div>
                            
                            {/* Signal Strength Icon (Visual Fluff) */}
                            <div className="flex gap-[2px] items-end h-4 mr-2 opacity-50">
                                <div className="w-1 h-1 bg-green-500"></div>
                                <div className="w-1 h-2 bg-green-500"></div>
                                <div className="w-1 h-3 bg-green-500"></div>
                                <div className="w-1 h-4 bg-green-500"></div>
                            </div>
                        </div>
                    ))
                )}
            </div>
            
            <div className="p-2 bg-black text-center text-xs text-gray-600 border-t border-gray-800">
                NUS_CRAFT_SERVER_v1.0.4 • {results.length} Players Online
            </div>
      </div>
    </div>
  );
};