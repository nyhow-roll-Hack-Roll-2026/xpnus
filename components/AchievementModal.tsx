import React, { useEffect, useState } from 'react';
import { X, Lock } from 'lucide-react';
import { Achievement, AchievementType } from '../types';
import { MinecraftButton } from '../src/components/MinecraftButton';
import { getAchievementLore } from '../services/geminiService';
import { AchievementIcon } from './AchievementIcon';

interface Props {
    achievement: Achievement;
    onClose: () => void;
    status: 'UNLOCKED' | 'READY' | 'LOCKED';
    onUnlock: (id: string) => void;
    parentTitle?: string;
}

export const AchievementModal: React.FC<Props> = ({ achievement, onClose, status, onUnlock, parentTitle }) => {
    const [lore, setLore] = useState<string>('Deciphering ancient texts...');
    const [isLoadingLore, setIsLoadingLore] = useState(false);

    useEffect(() => {
        let isMounted = true;
        const fetchLore = async () => {
            setIsLoadingLore(true);
            const text = await getAchievementLore(achievement);
            if (isMounted) {
                setLore(text);
                setIsLoadingLore(false);
            }
        };
        fetchLore();
        return () => { isMounted = false; };
    }, [achievement]);

    const frameTitle = achievement.type === AchievementType.CHALLENGE ? 'Challenge Complete!' : 'Advancement Made!';
    const isUnlocked = status === 'UNLOCKED';
    const isLocked = status === 'LOCKED';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-200">

            {/* 2D Modal Container with Gold Theme */}
            <div className={`relative w-full max-w-lg bg-neutral-900 border-2 shadow-[0_0_40px_rgba(0,0,0,0.5)] rounded-lg overflow-hidden flex flex-col ${isLocked ? 'border-gray-700' : 'border-mc-gold shadow-[0_0_40px_rgba(212,175,55,0.3)]'}`}>

                {/* Header */}
                <div className={`p-4 flex justify-between items-center text-white border-b ${isLocked ? 'bg-neutral-800 border-gray-700' : 'bg-black/80 border-mc-goldDim'}`}>
                    <span className={`text-2xl drop-shadow-md tracking-wide flex items-center gap-2 ${isLocked ? 'text-gray-400' : 'text-mc-yellow'}`}>
                        {isUnlocked && <span className="text-mc-green">★</span>}
                        {isLocked && <Lock size={20} />}
                        {isUnlocked ? frameTitle : (isLocked ? 'Locked Achievement' : 'Available Quest')}
                    </span>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-red-400 transition-colors pointer-events-auto p-1 hover:bg-white/10 rounded"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content Background with Pattern */}
                <div className="p-6 space-y-6 text-gray-200 bg-grid-pattern relative">
                    <div className="absolute inset-0 bg-gradient-to-b from-mc-gold/5 to-transparent pointer-events-none"></div>

                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-10">
                        <div className="flex-shrink-0 pt-2 transform hover:scale-105 transition-transform duration-300">
                            <AchievementIcon
                                iconName={achievement.iconName}
                                type={achievement.type}
                                category={achievement.category}
                                unlocked={isUnlocked}
                                size={48}
                            />
                        </div>

                        <div className="flex-1 space-y-2 text-center sm:text-left">
                            <h2 className={`text-3xl font-bold leading-none drop-shadow-sm ${isLocked ? 'text-gray-500' : 'text-white'}`}>
                                {achievement.title}
                            </h2>
                            <p className={`text-xl leading-snug ${isLocked ? 'text-gray-600' : 'text-gray-300'}`}>
                                {isLocked ? '???' : achievement.description}
                            </p>
                        </div>
                    </div>

                    {/* Lore Box - Only show if reachable or unlocked */}
                    {!isLocked && (
                        <div className="relative z-10 w-full bg-black/40 p-4 border border-mc-goldDim/50 rounded-lg shadow-inner">
                            <p className="text-gray-300 text-lg font-mono italic">
                                {isLoadingLore ? (
                                    <span className="animate-pulse text-gray-500">Loading lore from server...</span>
                                ) : (
                                    <span className="text-mc-yellow opacity-90">"{lore}"</span>
                                )}
                            </p>
                        </div>
                    )}

                    {/* Locked Message */}
                    {isLocked && (
                        <div className="relative z-10 w-full bg-red-900/20 p-4 border border-red-900/50 rounded-lg flex items-center gap-3">
                            <Lock className="text-red-400" size={24} />
                            <div>
                                <p className="text-red-300 font-bold uppercase text-sm tracking-wider">Locked</p>
                                <p className="text-gray-400 text-sm">Requires: <span className="text-white font-bold">{parentTitle || 'Previous Achievement'}</span></p>
                            </div>
                        </div>
                    )}

                    <div className="border-t border-mc-goldDim/30 border-dashed opacity-50 relative z-10"></div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4 text-center relative z-10">
                        <div className="bg-white/5 p-3 border border-white/10 rounded h-full hover:bg-white/10 transition-colors">
                            <p className="text-xs sm:text-sm uppercase tracking-widest text-gray-500 font-bold mb-1">Global Unlock</p>
                            <p className="text-2xl text-blue-400">{achievement.globalCompletionRate}%</p>
                        </div>
                        <div className="bg-white/5 p-3 border border-white/10 rounded h-full hover:bg-white/10 transition-colors">
                            <p className="text-xs sm:text-sm uppercase tracking-widest text-gray-500 font-bold mb-1">Reward</p>
                            <p className="text-2xl text-green-400">+{achievement.xp} XP</p>
                        </div>
                    </div>

                    {/* Action */}
                    <div className="w-full flex justify-end pt-4 relative z-10">
                        {isUnlocked ? (
                            <div className="w-full sm:w-auto flex justify-center items-center text-mc-gold font-bold text-2xl drop-shadow-sm bg-mc-gold/10 px-6 py-2 rounded border border-mc-gold/50">
                                <span>✓ COMPLETED</span>
                            </div>
                        ) : (
                            <MinecraftButton
                                onClick={() => !isLocked && onUnlock(achievement.id)}
                                variant={isLocked ? "disabled" : "green"}
                                className="w-full sm:w-auto shadow-lg"
                                disabled={isLocked}
                            >
                                {isLocked ? "LOCKED" : "COMPLETE ACHIEVEMENT"}
                            </MinecraftButton>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
};
