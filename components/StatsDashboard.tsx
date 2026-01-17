import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { RefreshCcw } from 'lucide-react';
import { UserProgress, Category, User } from '../types';
import { ACHIEVEMENTS, AVATARS } from '../constants';
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
      total: totalInCat
    };
  }).filter(d => d.value > 0);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  const level = Math.floor(progress.totalXp / 100) + 1;

  const handleAvatarClick = () => {
    // Cycle through avatars
    const currentUrl = user?.avatarUrl || AVATARS[0];
    const currentIndex = AVATARS.indexOf(currentUrl);
    // If current avatar is not in list (e.g. legacy custom upload), start from 0
    const nextIndex = (currentIndex === -1 ? 0 : currentIndex + 1) % AVATARS.length;
    onUpdateAvatar(AVATARS[nextIndex]);
  };

  return (
    <div className="bg-mc-panel border-4 border-black p-4 h-full flex flex-col shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)]">
      <h3 className="text-2xl text-[#373737] border-b-2 border-[#8B8B8B] mb-4 pb-2 flex justify-between">
          <span>Student Profile</span>
          <button onClick={onLogout} className="text-red-700 text-sm hover:underline">[Quit]</button>
      </h3>
      
      {/* User Avatar Section */}
      <div className="bg-[#8B8B8B] p-2 border-2 border-black shadow-inner mb-4 flex gap-3 items-center">
          <div 
            className="bg-black border-2 border-white w-[80px] h-[80px] shrink-0 overflow-hidden relative group cursor-pointer"
            onClick={handleAvatarClick}
            title="Click to cycle skin"
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
                <div className="w-full h-full bg-gray-700"></div>
              )}
              
              {/* Edit Overlay */}
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <RefreshCcw size={20} className="text-white" />
              </div>
          </div>
          
          <div className="overflow-hidden">
             <h2 className="text-2xl text-white truncate">{user?.username || 'Player'}</h2>
             <div className="text-mc-yellow text-sm">Year 1 Student</div>
          </div>
      </div>

      {/* Level Bar */}
      <div className="mb-6">
         <div className="flex justify-between text-[#373737] text-sm mb-1">
            <span>Level {level}</span>
            <span>{progress.totalXp} XP</span>
         </div>
         <div className="w-full bg-[#373737] h-6 border-2 border-white relative">
            <div 
                className="bg-mc-green h-full absolute left-0 top-0 transition-all duration-500" 
                style={{ width: `${Math.min(100, progress.totalXp % 100)}%` }}
            ></div>
            <div className="absolute inset-0 flex items-center justify-center text-xs text-white drop-shadow-md">
                {progress.totalXp % 100} / 100
            </div>
         </div>
      </div>

      <div className="flex-1 min-h-[200px] relative bg-[#E6E6E6] border-2 border-white shadow-inner p-2">
         <h4 className="text-[#373737] text-center mb-2">Completion Breakdown</h4>
         {data.length === 0 ? (
             <div className="flex items-center justify-center h-full text-gray-500 text-center p-4">
                 Start unlocking achievements to see stats!
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
                    >
                        {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="black" strokeWidth={2} />
                        ))}
                    </Pie>
                    <Tooltip 
                        contentStyle={{ backgroundColor: '#252525', border: '2px solid white', fontFamily: 'VT323', color: 'white' }}
                        itemStyle={{ color: 'white' }}
                    />
                </PieChart>
            </ResponsiveContainer>
         )}
      </div>
      
      <div className="mt-4 text-center text-[#555] text-sm">
        {progress.unlockedIds.length} / {ACHIEVEMENTS.length} Achievements
      </div>
    </div>
  );
};
