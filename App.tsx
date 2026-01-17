import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Menu, X, Compass, Plus, Minus } from 'lucide-react'; 
import { ACHIEVEMENTS } from './constants';
import { AchievementIcon } from './components/AchievementIcon';
import { AchievementModal } from './components/AchievementModal';
import { StatsDashboard } from './components/StatsDashboard';
import { UserProgress, Achievement, User, Category } from './types';
import { MinecraftButton } from './components/MinecraftButton';
import { getPersonalizedTip } from './services/geminiService';
import { LoginModal } from './components/LoginModal';
import { loginUser, loadUserProgress, saveUserProgress, getStoredUser, logoutUser, updateUserAvatar } from './services/authService';
import { DottedGlowBackground } from './components/ui/dotted-glow-background';

const App: React.FC = () => {
  // --- Auth State ---
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // --- Game State ---
  const [progress, setProgress] = useState<UserProgress>({ unlockedIds: ['nus_start'], totalXp: 0 });
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const [tip, setTip] = useState<string>("Loading tip...");
  const [filterCategory, setFilterCategory] = useState<Category | 'ALL'>('ALL');
  const [showMobileStats, setShowMobileStats] = useState(false);

  // --- Viewport State (Infinite Canvas) ---
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 }); // Mouse position at start
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });   // Pan value at start
  const [hasCenteredOnce, setHasCenteredOnce] = useState(false);
  
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

  const handleLogin = async (username: string, avatarUrl: string, isCustomAvatar: boolean) => {
      const loggedUser = await loginUser(username, avatarUrl, isCustomAvatar);
      await handlePostLogin(loggedUser);
  };

  const handleLogout = () => {
      logoutUser();
      setUser(null);
      setProgress({ unlockedIds: ['nus_start'], totalXp: 0 });
      setShowMobileStats(false);
      setHasCenteredOnce(false);
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

  // --- Tree Layout Algorithm (Contour-based / Reingold-Tilford inspired) ---
  const { nodes, edges, startNodePos } = useMemo(() => {
      // 1. Initialize Nodes Map
      const nodeMap = new Map<string, any>();
      ACHIEVEMENTS.forEach(ach => {
          nodeMap.set(ach.id, { ...ach, children: [], relY: 0, x: 0, y: 0 });
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
      const NODE_HEIGHT = 120; // Visual height of node + label
      const X_GAP = 350;       // Horizontal spacing
      const Y_GAP = 60;        // Minimum vertical gap between subtrees

      // 4. Contour Calculation (Post-Order Traversal)
      // Calculates the shape (top/bottom contours) of each subtree and assigns relative Y positions
      const layoutNode = (node: any): { top: number[], bot: number[] } => {
          if (node.children.length === 0) {
              return {
                  top: [-NODE_HEIGHT / 2],
                  bot: [NODE_HEIGHT / 2]
              };
          }

          const childContours = node.children.map((child: any) => layoutNode(child));

          // Merge children vertically
          let cumulativeBot: number[] = [];
          const childYOffsets: number[] = [];

          childContours.forEach((curr, i) => {
              if (i === 0) {
                  childYOffsets.push(0);
                  cumulativeBot = [...curr.bot];
              } else {
                  let shift = -Infinity;
                  
                  // Calculate required shift to avoid overlap with the cumulative bottom of previous siblings
                  const overlapDepth = Math.min(cumulativeBot.length, curr.top.length);
                  
                  for (let d = 0; d < overlapDepth; d++) {
                      // Ensure: prevBottom + GAP <= currTop + shift
                      const required = cumulativeBot[d] - curr.top[d] + Y_GAP;
                      if (required > shift) shift = required;
                  }
                  
                  // Default gap if no depth overlap (rare, but handles shallow siblings)
                  if (overlapDepth === 0) {
                      shift = cumulativeBot[0] - curr.top[0] + Y_GAP;
                  }
                  
                  // Safety Check
                  if (shift === -Infinity) shift = Y_GAP;

                  childYOffsets.push(shift);

                  // Update cumulative bottom contour
                  const maxDepth = Math.max(cumulativeBot.length, curr.bot.length);
                  for (let d = 0; d < maxDepth; d++) {
                      const oldVal = cumulativeBot[d] ?? -Infinity;
                      const newVal = (curr.bot[d] ?? -Infinity) + shift;
                      cumulativeBot[d] = Math.max(oldVal, newVal);
                  }
              }
          });

          // Center parent relative to the block of children
          const firstChildY = childYOffsets[0];
          const lastChildY = childYOffsets[childYOffsets.length - 1];
          const childrenCenter = (firstChildY + lastChildY) / 2;

          // Store relative Y (offset from parent center)
          node.children.forEach((child: any, i: number) => {
              child.relY = childYOffsets[i] - childrenCenter;
          });

          // Construct Parent Contour (Depth 0 is Parent, Depth 1+ is Children)
          const myTop = [-NODE_HEIGHT / 2];
          const myBot = [NODE_HEIGHT / 2];

          childContours.forEach((curr, i) => {
              const offset = node.children[i].relY;
              
              // Merge Child Top Contour
              curr.top.forEach((val, d) => {
                  const targetD = d + 1;
                  const absVal = val + offset;
                  if (myTop[targetD] === undefined || absVal < myTop[targetD]) {
                      myTop[targetD] = absVal;
                  }
              });

              // Merge Child Bottom Contour
              curr.bot.forEach((val, d) => {
                  const targetD = d + 1;
                  const absVal = val + offset;
                  if (myBot[targetD] === undefined || absVal > myBot[targetD]) {
                      myBot[targetD] = absVal;
                  }
              });
          });

          return { top: myTop, bot: myBot };
      };

      // 5. Run Layout
      roots.forEach(root => layoutNode(root));

      // 6. Assign Absolute Coordinates (Pre-Order Traversal)
      const finalNodes: any[] = [];
      const propagateCoordinates = (node: any, currentX: number, currentY: number) => {
          node.x = currentX;
          node.y = currentY;
          finalNodes.push(node);
          
          node.children.forEach((child: any) => {
              propagateCoordinates(child, currentX + X_GAP, currentY + child.relY);
          });
      };

      // Start at 0,0 (will be offset later)
      roots.forEach(root => propagateCoordinates(root, 0, 0));

      // 7. Apply Global Offsets & Edges
      const INITIAL_OFFSET_X = 500;
      const INITIAL_OFFSET_Y = 500;
      
      finalNodes.forEach(node => {
          node.x += INITIAL_OFFSET_X;
          node.y += INITIAL_OFFSET_Y;
      });

      const computedEdges: any[] = [];
      finalNodes.forEach(node => {
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
                  targetCategory: node.category,
                  sourceId: parent.id
              });
          }
      });

      const startNode = finalNodes.find(n => n.id === 'nus_start');

      return {
          nodes: finalNodes,
          edges: computedEdges,
          startNodePos: startNode ? { x: startNode.x, y: startNode.y } : { x: 0, y: 0 }
      };

  }, []);

  // --- Center View Logic ---
  const handleRecenter = () => {
    if (mapContainerRef.current) {
        const { clientWidth, clientHeight } = mapContainerRef.current;
        
        // We want the startNode to be at the center of the screen
        // Screen Center = Pan + (NodePos * Scale)
        // Pan = Screen Center - (NodePos * Scale)
        
        // Note: We add offsets for the node's visual center (approx 50px)
        const nodeCenterX = startNodePos.x + 100;
        const nodeCenterY = startNodePos.y + 100;

        const newPanX = (clientWidth / 2) - (nodeCenterX * scale);
        const newPanY = (clientHeight / 2) - (nodeCenterY * scale);
        
        setPan({ x: newPanX, y: newPanY });
    }
  };

  // Initial Auto-Center
  useEffect(() => {
    // We delay slightly to ensure DOM is ready
    const timer = setTimeout(() => {
        if (user && !hasCenteredOnce && mapContainerRef.current) {
            handleRecenter();
            setHasCenteredOnce(true);
        }
    }, 100);
    return () => clearTimeout(timer);
  }, [user, hasCenteredOnce]);

  // --- Zoom Logic ---
  const handleZoom = (direction: 'in' | 'out') => {
      const factor = direction === 'in' ? 1.2 : 0.8;
      let newScale = scale * factor;
      // Clamp scale
      newScale = Math.max(0.2, Math.min(3, newScale));
      
      // Smart Zoom: Keep center of screen at center
      if (mapContainerRef.current) {
        const { clientWidth, clientHeight } = mapContainerRef.current;
        
        // Current Center in World Coords
        // CenterX = (ScreenWidth/2 - PanX) / OldScale
        const centerX = (clientWidth / 2 - pan.x) / scale;
        const centerY = (clientHeight / 2 - pan.y) / scale;

        // New Pan to keep that World Center at Screen Center
        // NewPanX = ScreenWidth/2 - (CenterX * NewScale)
        const newPanX = (clientWidth / 2) - (centerX * newScale);
        const newPanY = (clientHeight / 2) - (centerY * newScale);

        setScale(newScale);
        setPan({ x: newPanX, y: newPanY });
      } else {
        setScale(newScale);
      }
  };

  // --- Drag Handlers (Mouse) ---
  const handleMouseDown = (e: React.MouseEvent) => {
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
      setPanStart({ x: pan.x, y: pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
      if (!isDragging) return;
      e.preventDefault();
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      setPan({
          x: panStart.x + dx,
          y: panStart.y + dy
      });
  };

  const handleMouseUp = () => {
      setIsDragging(false);
  };

  // --- Drag Handlers (Touch) ---
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
        setIsDragging(true);
        const touch = e.touches[0];
        setDragStart({ x: touch.clientX, y: touch.clientY });
        setPanStart({ x: pan.x, y: pan.y });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
     if (!isDragging) return;
     // Prevent pull-to-refresh etc
     
     if (e.touches.length === 1) {
         const touch = e.touches[0];
         const dx = touch.clientX - dragStart.x;
         const dy = touch.clientY - dragStart.y;
         setPan({
            x: panStart.x + dx,
            y: panStart.y + dy
         });
     }
  };

  const handleTouchEnd = () => {
      setIsDragging(false);
  };

  // --- RENDER ---

  if (!user && !isAuthLoading) {
      return <LoginModal onLogin={handleLogin} />;
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-neutral-950 text-gray-100 relative overflow-hidden">
      
      {/* Background with Dotted Glow */}
      <div className="absolute inset-0 z-0 bg-neutral-950">
        <DottedGlowBackground 
           className="opacity-50"
           gap={30}
           radius={1.5}
           colorDarkVar="#333"
           glowColorDarkVar="#D4AF37" // Gold glow for NUS theme
        />
        {/* Radial Vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#0a0a0a_100%)] pointer-events-none"></div>
      </div>

      {/* Header */}
      <header className="relative z-20 bg-black/60 backdrop-blur-md border-b border-mc-gold/30 p-4 flex justify-between items-center shadow-lg">
        <div className="flex items-center gap-4">
            {/* Mobile Menu Toggle */}
            <button 
                onClick={() => setShowMobileStats(true)} 
                className="lg:hidden text-mc-gold hover:text-white transition-colors"
            >
                <Menu size={28} />
            </button>
            
            <div>
                <h1 className="text-2xl md:text-4xl text-white drop-shadow-md tracking-wider flex items-center gap-2">
                    <span className="text-mc-gold">❖</span> NUS ACHIEVEMENTS
                </h1>
                <p className="text-gray-400 text-sm md:text-lg mt-1 hidden md:flex items-center gap-2">
                    <span className="text-mc-green animate-pulse">●</span> {tip}
                </p>
            </div>
        </div>
        <div className="flex gap-4">
             <div className="text-right hidden md:block">
                 <p className="text-xs text-mc-goldDim uppercase tracking-widest">Current Session</p>
                 <p className="text-xl text-gray-200">Year 1, Sem 1</p>
             </div>
             <MinecraftButton onClick={() => window.open('https://nus.edu.sg', '_blank')} className="hidden sm:block">
                NUS HOME
             </MinecraftButton>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden relative z-10">
        
        {/* Desktop Sidebar */}
        <aside className="w-80 p-4 hidden lg:block z-20 h-full border-r border-white/5 bg-black/20">
           <StatsDashboard 
                progress={progress} 
                user={user} 
                onLogout={handleLogout} 
                onUpdateAvatar={handleAvatarUpdate}
           />
        </aside>

        {/* Mobile Sidebar (Drawer) */}
        {showMobileStats && (
            <div className="fixed inset-0 z-50 lg:hidden">
                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowMobileStats(false)}></div>
                <div className="absolute left-0 top-0 bottom-0 w-80 bg-neutral-900 border-r border-mc-gold p-4 animate-in slide-in-from-left duration-200 shadow-2xl overflow-y-auto">
                    <div className="flex justify-end mb-2">
                        <button onClick={() => setShowMobileStats(false)} className="text-gray-400 hover:text-white">
                            <X size={24} />
                        </button>
                    </div>
                    <StatsDashboard 
                        progress={progress} 
                        user={user} 
                        onLogout={handleLogout} 
                        onUpdateAvatar={handleAvatarUpdate}
                    />
                </div>
            </div>
        )}

        {/* Map Wrapper with Filters */}
        <div className="relative flex-1 flex flex-col h-full overflow-hidden">
            
            {/* Filter Overlay - Scrollable horizontally on mobile */}
            <div className="absolute top-4 left-0 w-full px-4 z-30 pointer-events-auto overflow-x-auto no-scrollbar">
                <div className="flex gap-2 min-w-max pb-2">
                    <MinecraftButton 
                        variant={filterCategory === 'ALL' ? 'green' : 'default'} 
                        onClick={() => setFilterCategory('ALL')}
                        className="text-xs sm:text-sm px-3 py-1"
                    >
                        ALL
                    </MinecraftButton>
                    {Object.values(Category).map(cat => (
                        <MinecraftButton 
                            key={cat} 
                            variant={filterCategory === cat ? 'green' : 'default'} 
                            onClick={() => setFilterCategory(cat)}
                            className="text-xs sm:text-sm px-3 py-1"
                        >
                            {cat.toUpperCase()}
                        </MinecraftButton>
                    ))}
                </div>
            </div>

            {/* Canvas (Tree Visualization) */}
            <main 
                ref={mapContainerRef}
                className={`flex-1 w-full h-full relative overflow-hidden ${isDragging ? 'cursor-grabbing' : 'cursor-grab'} touch-none`}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                {/* 
                    INFINITE CANVAS CONTAINER 
                    We use CSS transform to move the world.
                */}
                <div 
                    className="absolute top-0 left-0 origin-top-left transition-transform duration-75 ease-out will-change-transform"
                    style={{ 
                        transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
                    }}
                >
                    
                    {/* 1. Connections Layer (SVG) */}
                    <svg 
                        className="absolute overflow-visible pointer-events-none"
                        style={{ top: 0, left: 0, width: 1, height: 1 }}
                    >
                        {edges.map(edge => {
                            if (filterCategory !== 'ALL' && (edge.sourceCategory !== filterCategory || edge.targetCategory !== filterCategory)) {
                                return null;
                            }

                            const isSourceUnlocked = progress.unlockedIds.includes(edge.sourceId);
                            const isTargetUnlocked = progress.unlockedIds.includes(edge.targetId);
                            const isPathActive = isSourceUnlocked && isTargetUnlocked;
                            // Show path if parent is unlocked (even if target is not), but dim it
                            const isPathVisible = isSourceUnlocked; 

                            const ICON_OFFSET = 40; 
                            const startX = edge.sourceX + 100 + 80; 
                            const startY = edge.sourceY + ICON_OFFSET + 100; 
                            const endX = edge.targetX + 100; 
                            const endY = edge.targetY + ICON_OFFSET + 100; 
                            
                            // Stepped Path (Manhattan)
                            const midX = (startX + endX) / 2;
                            const pathData = `M ${startX} ${startY} L ${midX} ${startY} L ${midX} ${endY} L ${endX} ${endY}`;

                            return (
                                <path 
                                    key={edge.id}
                                    d={pathData}
                                    stroke={isPathActive ? "#D4AF37" : (isPathVisible ? "#404040" : "#222")} 
                                    strokeWidth={isPathActive ? "6" : "3"}
                                    fill="none"
                                    strokeDasharray={isPathActive ? "none" : "10,5"}
                                    shapeRendering="geometricPrecision"
                                    className={`transition-all duration-500 ${isPathActive ? 'drop-shadow-[0_0_8px_rgba(212,175,55,0.8)] opacity-100' : (isPathVisible ? 'opacity-30' : 'opacity-10')}`}
                                />
                            );
                        })}
                    </svg>

                    {/* 2. Nodes Layer */}
                    {nodes.map(node => {
                        if (filterCategory !== 'ALL' && node.category !== filterCategory) {
                            return null;
                        }

                        const isUnlocked = progress.unlockedIds.includes(node.id);
                        const isParentUnlocked = node.parentId ? progress.unlockedIds.includes(node.parentId) : true;
                        
                        // VISIBILITY LOGIC:
                        // 1. Unlocked: Full opacity, color.
                        // 2. Parent Unlocked (Ready): Slightly dim, grayscale.
                        // 3. Parent Locked (Future): Very dim, grayscale, blur.
                        
                        let opacityClass = 'opacity-100';
                        if (!isUnlocked) {
                             if (isParentUnlocked) {
                                 opacityClass = 'opacity-80 grayscale';
                             } else {
                                 opacityClass = 'opacity-30 grayscale blur-[1px]';
                             }
                        }

                        return (
                            <div 
                                key={node.id} 
                                className="absolute group"
                                style={{ 
                                    left: `${node.x + 100}px`, 
                                    top: `${node.y + 100}px` 
                                }}
                            >
                                <div 
                                    className={`transition-all duration-200 cursor-pointer hover:scale-110 ${opacityClass}`}
                                    onClick={(e) => {
                                        e.stopPropagation(); 
                                        setSelectedAchievement(node);
                                    }}
                                >
                                    <AchievementIcon 
                                        iconName={node.iconName} 
                                        type={node.type} 
                                        category={node.category}
                                        unlocked={isUnlocked} 
                                        size={32}
                                    />
                                    <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 whitespace-nowrap bg-black/90 backdrop-blur text-mc-gold px-3 py-1 rounded-md text-xs opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 border border-mc-gold/50 font-pixel tracking-wide shadow-[0_0_10px_rgba(0,0,0,1)]">
                                        {node.title}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Controls (Zoom & Center) */}
                <div className="fixed bottom-6 right-6 flex flex-col gap-2 z-30 pointer-events-auto items-end">
                    <MinecraftButton 
                        onClick={handleRecenter} 
                        className="w-12 h-12 flex items-center justify-center text-xl bg-black/80 !border-mc-gold hover:!bg-mc-gold/20 mb-4"
                        title="Recenter Map"
                    >
                        <Compass size={24} />
                    </MinecraftButton>
                    
                    <div className="flex gap-2">
                        <MinecraftButton onClick={() => handleZoom('out')} className="w-12 h-12 flex items-center justify-center text-xl bg-black/80 !border-mc-gold hover:!bg-mc-gold/20">
                            <Minus size={20} />
                        </MinecraftButton>
                        <MinecraftButton onClick={() => handleZoom('in')} className="w-12 h-12 flex items-center justify-center text-xl bg-black/80 !border-mc-gold hover:!bg-mc-gold/20">
                            <Plus size={20} />
                        </MinecraftButton>
                    </div>
                </div>
            </main>
        </div>

      </div>

      {/* Modals */}
      {selectedAchievement && (
        <AchievementModal 
            achievement={selectedAchievement} 
            onClose={() => setSelectedAchievement(null)} 
            status={
                progress.unlockedIds.includes(selectedAchievement.id) ? 'UNLOCKED' : 
                (!selectedAchievement.parentId || progress.unlockedIds.includes(selectedAchievement.parentId)) ? 'READY' : 'LOCKED'
            }
            onUnlock={handleUnlock}
            parentTitle={selectedAchievement.parentId ? ACHIEVEMENTS.find(a => a.id === selectedAchievement.parentId)?.title : undefined}
        />
      )}
    </div>
  );
};

export default App;