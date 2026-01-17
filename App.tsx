import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ACHIEVEMENTS } from './constants';
import { AchievementIcon } from './components/AchievementIcon';
import { AchievementModal } from './components/AchievementModal';
import { StatsDashboard } from './components/StatsDashboard';
import { UserProgress, Achievement, User, Category } from './types';
import { MinecraftButton } from './components/MinecraftButton';
import { getPersonalizedTip } from './services/geminiService';
import { LoginModal } from './components/LoginModal';
import { loginUser, loadUserProgress, saveUserProgress, getStoredUser, logoutUser, updateUserAvatar } from './services/authService';

const App: React.FC = () => {
  // --- Auth State ---
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // --- Game State ---
  const [progress, setProgress] = useState<UserProgress>({ unlockedIds: ['nus_start'], totalXp: 0 });
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const [tip, setTip] = useState<string>("Loading tip...");
  const [scale, setScale] = useState(1);
  const [filterCategory, setFilterCategory] = useState<Category | 'ALL'>('ALL');

  // --- Map Panning State ---
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });
  const [scrollStart, setScrollStart] = useState({ left: 0, top: 0 });
  
  // 1. Check for existing session on mount
  useEffect(() => {
    const storedUser = getStoredUser();
    if (storedUser) {
        handlePostLogin(storedUser);
    } else {
        setIsAuthLoading(false);
    }
  }, []);

  // 2. Load Data when User is set
  const handlePostLogin = async (loggedUser: User) => {
      setUser(loggedUser);
      setIsAuthLoading(true);
      try {
          const savedData = await loadUserProgress(loggedUser.username);
          if (savedData) {
              setProgress(savedData);
          } else {
              // New save for this user
              setProgress({ unlockedIds: ['nus_start'], totalXp: 0 });
          }
      } catch (e) {
          console.error("Failed to load progress", e);
      } finally {
          setIsAuthLoading(false);
      }
  };

  // 3. Load Tip
  useEffect(() => {
    getPersonalizedTip(progress.unlockedIds.length).then(setTip);
  }, [progress.unlockedIds.length]);

  const handleLogin = async (username: string, avatarUrl: string) => {
      const loggedUser = await loginUser(username, avatarUrl);
      await handlePostLogin(loggedUser);
  };

  const handleLogout = () => {
      logoutUser();
      setUser(null);
      setProgress({ unlockedIds: ['nus_start'], totalXp: 0 });
  };

  const handleAvatarUpdate = async (newUrl: string) => {
      if (!user) return;
      try {
        const updatedUser = await updateUserAvatar(user.username, newUrl);
        setUser(updatedUser);
      } catch (e) {
        console.error("Failed to update avatar", e);
        alert("Failed to update profile picture.");
      }
  };

  const handleUnlock = async (id: string) => {
    const achievement = ACHIEVEMENTS.find(a => a.id === id);
    if (!achievement) return;

    if (!progress.unlockedIds.includes(id)) {
        // Only allow unlocking if parent is unlocked (unless it's root)
        if (achievement.parentId && !progress.unlockedIds.includes(achievement.parentId)) {
            alert("You must complete the previous achievement first!");
            return;
        }

        const newProgress = {
            unlockedIds: [...progress.unlockedIds, id],
            totalXp: progress.totalXp + achievement.xp
        };

        setProgress(newProgress);
        
        // Auto-Save to DB
        if (user) {
            await saveUserProgress(user.username, newProgress);
        }
    }
    setSelectedAchievement(null);
  };

  // --- Tree Layout Algorithm ---
  const { nodes, edges, containerWidth, containerHeight } = useMemo(() => {
      // 1. Initialize Nodes
      const nodeMap = new Map<string, any>();
      ACHIEVEMENTS.forEach(ach => {
          nodeMap.set(ach.id, { ...ach, children: [], x: 0, y: 0 });
      });

      // 2. Build Hierarchy
      const roots: any[] = [];
      ACHIEVEMENTS.forEach(ach => {
          const node = nodeMap.get(ach.id);
          if (ach.parentId && nodeMap.has(ach.parentId)) {
              nodeMap.get(ach.parentId).children.push(node);
          } else {
              roots.push(node);
          }
      });

      // 3. Layout Configuration
      const X_GAP = 280; // Horizontal distance between columns
      const Y_GAP = 140; // Vertical distance between leaf nodes
      let currentY = 0;

      // 4. Recursive Positioning (DFS)
      const traverse = (node: any, depth: number) => {
          if (node.children.length === 0) {
              // Leaf node
              node.x = depth * X_GAP;
              node.y = currentY;
              currentY += Y_GAP;
              return;
          }

          // Process children first to determine parent's Y
          node.children.forEach((child: any) => traverse(child, depth + 1));

          node.x = depth * X_GAP;
          const firstChild = node.children[0];
          const lastChild = node.children[node.children.length - 1];
          
          // Center parent vertically relative to its children
          node.y = (firstChild.y + lastChild.y) / 2;
      };

      // Run layout for each root (handles disjoint trees if any)
      roots.forEach(root => traverse(root, 0));

      // 5. Generate Layout Objects
      const computedNodes = Array.from(nodeMap.values());
      const computedEdges: any[] = [];

      computedNodes.forEach(node => {
          if (node.parentId) {
              const parent = nodeMap.get(node.parentId);
              computedEdges.push({
                  id: `${parent.id}-${node.id}`,
                  sourceX: parent.x,
                  sourceY: parent.y,
                  targetX: node.x,
                  targetY: node.y,
                  targetId: node.id,
                  sourceCategory: parent.category,
                  targetCategory: node.category
              });
          }
      });

      // Calculate container bounds
      const maxX = Math.max(...computedNodes.map(n => n.x));
      const maxY = Math.max(...computedNodes.map(n => n.y));

      return {
          nodes: computedNodes,
          edges: computedEdges,
          containerWidth: maxX + 400, // Add padding for right side
          containerHeight: maxY + 400 // Add padding for bottom
      };

  }, []); // Only runs once as ACHIEVEMENTS is constant

  // --- Map Drag Handlers ---
  const handleMouseDown = (e: React.MouseEvent) => {
      if (!mapContainerRef.current) return;
      setIsDragging(true);
      setStartPan({ x: e.clientX, y: e.clientY });
      setScrollStart({ 
          left: mapContainerRef.current.scrollLeft, 
          top: mapContainerRef.current.scrollTop 
      });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
      if (!isDragging || !mapContainerRef.current) return;
      e.preventDefault();
      const dx = e.clientX - startPan.x;
      const dy = e.clientY - startPan.y;
      
      mapContainerRef.current.scrollLeft = scrollStart.left - dx;
      mapContainerRef.current.scrollTop = scrollStart.top - dy;
  };

  const handleMouseUp = () => {
      setIsDragging(false);
  };

  // --- RENDER ---

  if (!user && !isAuthLoading) {
      return <LoginModal onLogin={handleLogin} />;
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-[#252525] relative overflow-hidden">
      
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-stone opacity-20 pointer-events-none z-0"></div>

      {/* Header */}
      <header className="relative z-10 bg-mc-panel border-b-4 border-black p-4 flex justify-between items-center shadow-lg">
        <div>
            <h1 className="text-4xl text-[#373737] drop-shadow-md">NUS Achievements</h1>
            <p className="text-[#555] text-lg mt-1 flex items-center gap-2">
                <span className="text-mc-green animate-pulse">●</span> {tip}
            </p>
        </div>
        <div className="flex gap-4">
             <div className="text-right hidden md:block">
                 <p className="text-sm text-gray-600">Current Session</p>
                 <p className="text-xl text-[#373737]">Year 1, Sem 1</p>
             </div>
             <MinecraftButton onClick={() => window.open('https://nus.edu.sg', '_blank')}>
                NUS HOME
             </MinecraftButton>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden relative z-10">
        
        {/* Sidebar */}
        <aside className="w-80 p-4 hidden lg:block z-20">
           <StatsDashboard 
                progress={progress} 
                user={user} 
                onLogout={handleLogout} 
                onUpdateAvatar={handleAvatarUpdate}
           />
        </aside>

        {/* Map Wrapper with Filters */}
        <div className="relative flex-1 flex flex-col h-full bg-dirt bg-repeat">
            
            {/* Filter Overlay */}
            <div className="absolute top-4 left-4 z-30 flex gap-2 flex-wrap pointer-events-auto pr-4 max-w-full">
                <MinecraftButton 
                    variant={filterCategory === 'ALL' ? 'green' : 'default'} 
                    onClick={() => setFilterCategory('ALL')}
                    className="text-sm px-3 py-1"
                >
                    ALL
                </MinecraftButton>
                {Object.values(Category).map(cat => (
                    <MinecraftButton 
                        key={cat} 
                        variant={filterCategory === cat ? 'green' : 'default'} 
                        onClick={() => setFilterCategory(cat)}
                        className="text-sm px-3 py-1"
                    >
                        {cat.toUpperCase()}
                    </MinecraftButton>
                ))}
            </div>

            {/* Canvas (Tree Visualization) */}
            <main 
                ref={mapContainerRef}
                className={`flex-1 overflow-auto bg-black/20 relative shadow-[inset_0_0_20px_rgba(0,0,0,0.8)] ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            >
                <div 
                    className="origin-top-left relative" 
                    style={{ 
                        transform: `scale(${scale})`,
                        width: containerWidth,
                        height: containerHeight,
                        padding: '80px' // Initial offset
                    }}
                >
                    {/* 1. Connections Layer (SVG) */}
                    <svg className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-visible">
                        {edges.map(edge => {
                            // Filter Logic: Show edge if ALL is selected, OR if both source and target match the category
                            // For tree structures, filtering usually disconnects branches if parents are hidden.
                            if (filterCategory !== 'ALL' && (edge.sourceCategory !== filterCategory || edge.targetCategory !== filterCategory)) {
                                return null;
                            }

                            const ICON_OFFSET = 40; // Half of 80px icon size
                            const startX = edge.sourceX + 80 + 80; // Node X + Icon Width + padding
                            const startY = edge.sourceY + ICON_OFFSET + 80; // Node Y + Icon Center + padding
                            const endX = edge.targetX + 80; // Node X + padding
                            const endY = edge.targetY + ICON_OFFSET + 80; // Node Y + Icon Center + padding
                            
                            // Stepped Path (Manhattan)
                            const midX = (startX + endX) / 2;
                            const pathData = `M ${startX} ${startY} L ${midX} ${startY} L ${midX} ${endY} L ${endX} ${endY}`;

                            return (
                                <path 
                                    key={edge.id}
                                    d={pathData}
                                    stroke="#373737"
                                    strokeWidth="4"
                                    fill="none"
                                    shapeRendering="crispEdges"
                                />
                            );
                        })}
                    </svg>

                    {/* 2. Nodes Layer */}
                    {nodes.map(node => {
                        // Filter Logic
                        if (filterCategory !== 'ALL' && node.category !== filterCategory) {
                            return null;
                        }

                        const isUnlocked = progress.unlockedIds.includes(node.id);
                        const isParentUnlocked = node.parentId ? progress.unlockedIds.includes(node.parentId) : true;
                        // Determine visibility logic:
                        // If filtered, we show the node regardless of parent status? 
                        // Or do we still respect "Fog of War"? 
                        // Usually Fog of War respects the logic of "can I reach this?". 
                        // If we filter, we might see isolated nodes. 
                        // Let's keep the "canSee" logic based on unlocks, regardless of filter visibility of parent.
                        const canSee = isUnlocked || isParentUnlocked;

                        return (
                            <div 
                                key={node.id} 
                                className="absolute group"
                                style={{ 
                                    left: node.x + 80, // + Padding 
                                    top: node.y + 80   // + Padding
                                }}
                            >
                                <div 
                                    className={`transition-all duration-200 ${canSee ? 'opacity-100 cursor-pointer' : 'opacity-50 grayscale cursor-not-allowed'}`}
                                    onClick={(e) => {
                                        e.stopPropagation(); // Prevent drag start when clicking an achievement
                                        if(canSee) setSelectedAchievement(node);
                                    }}
                                >
                                    <AchievementIcon 
                                        iconName={node.iconName} 
                                        type={node.type} 
                                        unlocked={isUnlocked} 
                                        size={32}
                                    />
                                    <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap bg-black/70 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 border border-white font-pixel">
                                        {node.title}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Zoom Controls */}
                <div className="absolute bottom-8 right-8 flex gap-2 z-30 pointer-events-auto">
                    <MinecraftButton onClick={() => setScale(s => Math.max(0.5, s - 0.1))} className="w-10 h-10 flex items-center justify-center">-</MinecraftButton>
                    <MinecraftButton onClick={() => setScale(s => Math.min(1.5, s + 0.1))} className="w-10 h-10 flex items-center justify-center">+</MinecraftButton>
                </div>
            </main>
        </div>

      </div>

      {/* Modals */}
      {selectedAchievement && (
        <AchievementModal 
            achievement={selectedAchievement} 
            onClose={() => setSelectedAchievement(null)} 
            unlocked={progress.unlockedIds.includes(selectedAchievement.id)}
            onUnlock={handleUnlock}
        />
      )}
    </div>
  );
};

export default App;
