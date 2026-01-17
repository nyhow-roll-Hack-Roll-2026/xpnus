import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { Achievement, AchievementType } from '../types';
import { MinecraftButton } from './MinecraftButton';
import { getAchievementLore } from '../services/geminiService';
import { AchievementIcon } from './AchievementIcon';
import { CardContainer, CardBody, CardItem } from './ui/3d-card';

interface Props {
  achievement: Achievement;
  onClose: () => void;
  unlocked: boolean;
  onUnlock: (id: string) => void;
}

export const AchievementModal: React.FC<Props> = ({ achievement, onClose, unlocked, onUnlock }) => {
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-200">
      
      <CardContainer containerClassName="w-full max-w-lg z-50" className="w-full">
        <CardBody className="relative w-full bg-[#C6C6C6] border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col">
            
            {/* Header */}
            <CardItem translateZ="20" className="w-full">
                <div className="bg-[#373737] p-3 flex justify-between items-center text-white border-b-4 border-[#8B8B8B] shadow-sm">
                    <span className="text-2xl text-mc-yellow drop-shadow-md tracking-wide">{unlocked ? frameTitle : 'Locked Achievement'}</span>
                    <button onClick={onClose} className="hover:text-red-400 transition-colors pointer-events-auto">
                        <X size={28} />
                    </button>
                </div>
            </CardItem>

            {/* Content */}
            <div className="p-6 space-y-6 text-[#373737] bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] bg-repeat" style={{ transformStyle: 'preserve-3d' }}>
            
                <div className="flex items-start gap-6">
                    <CardItem translateZ="50" className="flex-shrink-0 pt-2">
                        <AchievementIcon 
                            iconName={achievement.iconName} 
                            type={achievement.type} 
                            unlocked={unlocked} 
                            size={32}
                        />
                    </CardItem>
                    
                    <div className="flex-1 space-y-2">
                        <CardItem translateZ="30" as="h2" className="text-3xl font-bold leading-none">
                            {achievement.title}
                        </CardItem>
                        <CardItem translateZ="20" as="p" className="text-xl leading-snug">
                            {achievement.description}
                        </CardItem>
                    </div>
                </div>
            
                {/* Lore Box */}
                <CardItem translateZ="40" className="w-full">
                    <div className="bg-[#8B8B8B] p-3 border-2 border-[#373737] shadow-[inset_2px_2px_0px_#555,inset_-2px_-2px_0px_#C6C6C6]">
                        <p className="text-white text-lg font-mono italic">
                            {isLoadingLore ? (
                            <span className="animate-pulse">Loading lore from the server...</span>
                            ) : (
                            <span className="text-mc-yellow">"{lore}"</span>
                            )}
                        </p>
                    </div>
                </CardItem>

                <div className="border-t-4 border-[#8B8B8B] border-dashed opacity-50"></div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 text-center" style={{ transformStyle: 'preserve-3d' }}>
                    <CardItem translateZ="30" className="w-full">
                        <div className="bg-[#E6E6E6] p-3 border-2 border-white shadow-[2px_2px_0px_#888] h-full">
                            <p className="text-sm uppercase tracking-widest text-gray-600 font-bold mb-1">Global Unlock</p>
                            <p className="text-2xl text-blue-800">{achievement.globalCompletionRate}%</p>
                        </div>
                    </CardItem>
                    <CardItem translateZ="30" className="w-full">
                        <div className="bg-[#E6E6E6] p-3 border-2 border-white shadow-[2px_2px_0px_#888] h-full">
                            <p className="text-sm uppercase tracking-widest text-gray-600 font-bold mb-1">Reward</p>
                            <p className="text-2xl text-green-700">+{achievement.xp} XP</p>
                        </div>
                    </CardItem>
                </div>

                {/* Action */}
                <CardItem translateZ="60" className="w-full flex justify-end pt-4">
                    {!unlocked ? (
                    <MinecraftButton onClick={() => onUnlock(achievement.id)} variant="green">
                        COMPLETE ACHIEVEMENT
                    </MinecraftButton>
                    ) : (
                    <div className="flex items-center text-mc-darkGreen font-bold text-2xl drop-shadow-sm bg-white/30 px-4 py-2 rounded border-2 border-mc-darkGreen">
                        <span>✓ COMPLETED</span>
                    </div>
                    )}
                </CardItem>

            </div>
        </CardBody>
      </CardContainer>
    </div>
  );
};
