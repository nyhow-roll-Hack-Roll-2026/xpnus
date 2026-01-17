import React, { useState } from 'react';
import { X, ExternalLink, Download, Send, Package, MessageSquare } from 'lucide-react';
import { ACHIEVEMENTS } from '../constants';
import { PixelatedCanvas } from './ui/pixelated-canvas';

interface Props {
  unlockedIds: string[];
  onClose: () => void;
}

export const ResourcesModal: React.FC<Props> = ({ unlockedIds, onClose }) => {
  const [activeTab, setActiveTab] = useState<'STASH' | 'LOGS'>('STASH');

  // Aggregate resources from unlocked achievements
  const unlockedResources = ACHIEVEMENTS
    .filter(ach => unlockedIds.includes(ach.id) && ach.resources && ach.resources.length > 0)
    .map(ach => ({
        sourceTitle: ach.title,
        items: ach.resources!
    }));

  // Aggregate guestbook entries from unlocked achievements (Mock "Server Activity")
  const serverLogs = ACHIEVEMENTS
    .filter(ach => unlockedIds.includes(ach.id) && ach.guestbook && ach.guestbook.length > 0)
    .flatMap(ach => ach.guestbook!.map(entry => ({ ...entry, source: ach.title })))
    .sort(() => Math.random() - 0.5); // Shuffle for "feed" look

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-200">
      <div className="relative w-full max-w-2xl bg-neutral-900 border-2 border-mc-gold shadow-[0_0_50px_rgba(212,175,55,0.2)] rounded-lg overflow-hidden flex flex-col max-h-[85vh]">
            
            {/* Header */}
            <div className="p-4 flex justify-between items-center bg-black/80 border-b border-mc-goldDim">
                <div className="flex items-center gap-3">
                    <div className="bg-mc-gold/20 p-2 rounded">
                        <Package className="text-mc-gold" size={24} />
                    </div>
                    <div>
                        <h2 className="text-2xl text-white font-bold tracking-wide drop-shadow-md">PLAYER INVENTORY</h2>
                        <p className="text-xs text-gray-400 uppercase tracking-widest">Year 1 Survival Kit</p>
                    </div>
                </div>
                <button 
                    onClick={onClose} 
                    className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/10 rounded"
                >
                    <X size={24} />
                </button>
            </div>

            {/* Navigation */}
            <div className="flex px-4 pt-4 border-b border-white/10 bg-grid-pattern">
                <button 
                    onClick={() => setActiveTab('STASH')}
                    className={`px-6 py-3 font-bold text-sm tracking-widest flex items-center gap-2 transition-all ${activeTab === 'STASH' ? 'text-black bg-mc-gold border-t-2 border-x-2 border-white/20 rounded-t' : 'text-gray-500 hover:text-gray-300'}`}
                >
                    SENIOR'S STASH ({unlockedResources.reduce((acc, curr) => acc + curr.items.length, 0)})
                </button>
                <button 
                    onClick={() => setActiveTab('LOGS')}
                    className={`px-6 py-3 font-bold text-sm tracking-widest flex items-center gap-2 transition-all ${activeTab === 'LOGS' ? 'text-black bg-mc-gold border-t-2 border-x-2 border-white/20 rounded-t' : 'text-gray-500 hover:text-gray-300'}`}
                >
                    SERVER LOGS
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto bg-black/40 p-6 relative">
                <div className="absolute inset-0 bg-grid-pattern opacity-20 pointer-events-none"></div>
                
                {activeTab === 'STASH' && (
                    <div className="space-y-6 relative z-10 animate-in slide-in-from-bottom-4 duration-300">
                        {unlockedResources.length === 0 ? (
                            <div className="text-center py-20 opacity-50">
                                <Package size={48} className="mx-auto mb-4 text-gray-600" />
                                <p className="text-xl text-gray-400">Inventory Empty</p>
                                <p className="text-sm text-gray-600">Complete achievements to loot resources.</p>
                            </div>
                        ) : (
                            unlockedResources.map((group, idx) => (
                                <div key={idx} className="bg-white/5 border border-white/10 rounded-lg overflow-hidden">
                                    <div className="bg-white/5 px-4 py-2 border-b border-white/5 flex justify-between items-center">
                                        <h3 className="text-mc-gold font-bold text-sm uppercase tracking-wider">{group.sourceTitle}</h3>
                                        <span className="text-xs text-gray-500 bg-black/50 px-2 py-1 rounded">Source</span>
                                    </div>
                                    <div className="p-2 space-y-1">
                                        {group.items.map((item, i) => (
                                            <a 
                                                key={i} 
                                                href={item.url} 
                                                target="_blank" 
                                                rel="noreferrer"
                                                className="flex items-center gap-3 p-3 hover:bg-white/10 rounded transition-colors group"
                                            >
                                                <div className="bg-black/40 p-2 rounded text-mc-gold group-hover:scale-110 transition-transform">
                                                    {item.type === 'LINK' && <ExternalLink size={18} />}
                                                    {item.type === 'PDF' && <Download size={18} />}
                                                    {item.type === 'TELEGRAM' && <Send size={18} />}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-gray-200 font-bold leading-none">{item.label}</p>
                                                    <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-wider">{item.type}</p>
                                                </div>
                                                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <ExternalLink size={14} className="text-gray-500" />
                                                </div>
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {activeTab === 'LOGS' && (
                    <div className="space-y-2 relative z-10 animate-in slide-in-from-bottom-4 duration-300">
                         {serverLogs.length === 0 ? (
                            <div className="text-center py-20 text-gray-500">
                                No activity detected...
                            </div>
                        ) : (
                            serverLogs.map((log, i) => (
                                <div key={i} className="flex gap-4 items-start bg-black/20 p-3 rounded border border-white/5 hover:border-white/20 transition-colors">
                                    <div className="w-10 h-10 bg-gray-800 rounded overflow-hidden flex-shrink-0 border border-white/10">
                                        {log.avatarSeed && (
                                            <PixelatedCanvas 
                                                src={typeof log.avatarSeed === 'string' ? log.avatarSeed : ''}
                                                width={40} height={40} cellSize={4}
                                                interactive={false}
                                            />
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <p className="text-mc-gold font-bold text-sm">{log.username}</p>
                                            <span className="text-[10px] text-gray-600 uppercase">{log.date}</span>
                                        </div>
                                        <p className="text-gray-300 text-sm italic">"{log.message}"</p>
                                        <div className="mt-2 flex items-center gap-1 text-[10px] text-gray-500">
                                            <MessageSquare size={10} />
                                            <span>Signed in <span className="text-gray-400">{log.source}</span></span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
      </div>
    </div>
  );
};
