import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { RefreshCcw } from 'lucide-react';
import { UserProgress, Category, User } from '../types';
import { ACHIEVEMENTS, AVATARS, CATEGORY_COLORS } from '../constants';
import { PixelatedCanvas } from './ui/pixelated-canvas';

interface Props {
  progress: UserProgress;
  user: User | null;
  onLogout: () => void;
  onUpdateAvatar: (newUrl: string) => void;
}

export const StatsDashboard: React.FC<Props> = ({ progress, user, onLogout, onUpdateAvatar }) => {
  
  // Calculate stats by category
  const data = Object.values(Category).map(cat => {
    const totalInCat = ACHIEVEMENTS.filter(a => a.category === cat).length;
    const unlockedInCat = ACHIEVEMENTS.filter(a => a.category === cat && progress.unlockedIds.includes(a.id)).length;
    return {
      name: cat,
      value: unlockedInCat,
      total: totalInCat,
      color: CATEGORY_COLORS[cat] || '#888888'
    };
  }).filter(d => d.value > 0);

  const level = Math.floor(progress.totalXp / 100) + 1;
  
  const isCustomAvatar = user?.isCustomAvatar || false;

  const handleAvatarClick = () => {
    // Prevent changing if custom avatar is set
    if (isCustomAvatar) return;

    // Cycle through avatars
    const currentUrl = user?.avatarUrl || AVATARS[0];
    const currentIndex = AVATARS.indexOf(currentUrl);
    // If current avatar is not in list (e.g. legacy custom upload), start from 0
    const nextIndex = (currentIndex === -1 ? 0 : currentIndex + 1) % AVATARS.length;
    onUpdateAvatar(AVATARS[nextIndex]);
  };

  return (
    <div className="bg-black/40 backdrop-blur-md border border-white/10 p-4 h-full flex flex-col rounded-lg shadow-xl">
      <h3 className="text-2xl text-white border-b border-white/10 mb-4 pb-2 flex justify-between items-center">
          <span className="tracking-wide">Student Profile</span>
          <button onClick={onLogout} className="text-red-400 text-sm hover:text-red-300 transition-colors">[Quit]</button>
      </h3>
      
      {/* User Avatar Section */}
      <div className="bg-black/50 p-3 rounded border border-white/5 mb-6 flex gap-4 items-center shadow-inner">
          <div 
            className={`bg-black border border-white/20 w-[80px] h-[80px] shrink-0 overflow-hidden relative group rounded-sm shadow-[0_0_15px_rgba(255,255,255,0.1)] ${!isCustomAvatar ? 'cursor-pointer' : 'cursor-default'}`}
            onClick={handleAvatarClick}
            title={isCustomAvatar ? "Custom skin loaded" : "Click to cycle skin"}
          >
              {user ? (
                 <PixelatedCanvas 
                    src={user.avatarUrl} 
                    width={80} 
                    height={80} 
                    cellSize={4}
                    shape="square"
                    interactive={true}
                    distortionMode="repel"
                    distortionStrength={2}
                    distortionRadius={30}
                    jitterStrength={1}
                    followSpeed={0.2}
                 />
              ) : (
                <div className="w-full h-full bg-gray-900"></div>
              )}
              
              {/* Edit Overlay (Only if not custom) */}
              {!isCustomAvatar && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <RefreshCcw size={20} className="text-white" />
                </div>
              )}
          </div>
          
          <div className="overflow-hidden">
             <h2 className="text-2xl text-white truncate font-bold">{user?.username || 'Player'}</h2>
             <div className="text-mc-yellow text-sm tracking-wide">Year 1 Student</div>
          </div>
      </div>

      {/* Level Bar */}
      <div className="mb-6">
         <div className="flex justify-between text-gray-300 text-sm mb-1">
            <span>Level {level}</span>
            <span>{progress.totalXp} XP</span>
         </div>
         <div className="w-full bg-black/60 h-6 border border-white/20 relative rounded-sm overflow-hidden">
            <div 
                className="bg-gradient-to-r from-green-600 to-green-500 h-full absolute left-0 top-0 transition-all duration-500" 
                style={{ width: `${Math.min(100, progress.totalXp % 100)}%` }}
            ></div>
            <div className="absolute inset-0 flex items-center justify-center text-xs text-white drop-shadow-md z-10 font-bold tracking-widest">
                {progress.totalXp % 100} / 100
            </div>
         </div>
      </div>

      <div className="flex-1 min-h-[200px] relative bg-black/20 border border-white/5 rounded-lg p-2">
         <h4 className="text-gray-300 text-center mb-2 tracking-wider text-lg">Breakdown</h4>
         {data.length === 0 ? (
             <div className="flex items-center justify-center h-full text-gray-500 text-center p-4">
                 Unlock achievements to generate stats...
             </div>
         ) : (
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={30}
                        outerRadius={60}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                    >
                        {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                    </Pie>
                    <Tooltip 
                        contentStyle={{ backgroundColor: '#000', border: '1px solid #333', borderRadius: '4px', fontFamily: 'VT323', color: 'white' }}
                        itemStyle={{ color: '#ccc' }}
                    />
                </PieChart>
            </ResponsiveContainer>
         )}
      </div>
      
      <div className="mt-4 text-center text-gray-500 text-sm">
        {progress.unlockedIds.length} / {ACHIEVEMENTS.length} Achievements Unlocked
      </div>
    </div>
  );
};