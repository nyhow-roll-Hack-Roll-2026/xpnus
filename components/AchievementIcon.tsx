import React from 'react';
import * as Icons from 'lucide-react';
import { AchievementType } from '../types';
import { CardContainer, CardBody, CardItem } from './ui/3d-card';

interface Props {
  iconName: string;
  type: AchievementType;
  unlocked: boolean;
  size?: number;
}

export const AchievementIcon: React.FC<Props> = ({ iconName, type, unlocked, size = 32 }) => {
  const LucideIcon = (Icons as any)[iconName] || Icons.HelpCircle;

  // Configuration for 3D Bevel Styles
  const styles = {
    locked: {
      bg: '#8B8B8B',     // Stone Grey
      light: '#C6C6C6',  // Light Stone
      dark: '#373737'    // Dark Stone/Shadow
    },
    root: {
      bg: '#5D8D42',     // Grass Green
      light: '#7FBC5D',  // Light Grass
      dark: '#2F4721'    // Dark Dirt
    },
    task: {
      bg: '#D9A334',     // Gold
      light: '#F7D46D',
      dark: '#8C6212'
    },
    goal: {
      bg: '#D9A334',
      light: '#F7D46D',
      dark: '#8C6212'
    },
    challenge: {
      bg: '#8F3985',     // Purple
      light: '#C965BE',
      dark: '#541A4D'    // Dark Purple
    }
  };

  let currentStyle = styles.locked;
  if (unlocked) {
    if (type === AchievementType.ROOT) currentStyle = styles.root;
    else if (type === AchievementType.CHALLENGE) currentStyle = styles.challenge;
    else currentStyle = styles.task;
  }

  const isGoal = type === AchievementType.GOAL;
  const isChallenge = type === AchievementType.CHALLENGE;
  
  let borderRadius = '4px';
  if (isGoal) borderRadius = '50%';
  if (isChallenge) borderRadius = '2px';

  const containerSize = 'w-20 h-20'; 

  return (
    <CardContainer containerClassName={containerSize} className="w-full h-full">
        <CardBody className="relative w-full h-full">
            
            {/* 1. Shadow Layer */}
            {/* We apply the static rotation/offset here in CSS or wrapper, keeping CardItem for depth */}
            <CardItem translateZ="-20" className="absolute inset-0 w-full h-full">
                 <div 
                    className="w-full h-full bg-black opacity-40" 
                    style={{ 
                        borderRadius: borderRadius,
                        // Static transforms for the shape
                        transform: isChallenge ? 'rotate(45deg) scale(0.85) translate(4px, 4px)' : 'translate(8px, 8px)'
                    }}
                />
            </CardItem>

            {/* 2. Main Frame Layer - Pops out */}
            <CardItem translateZ="30" className="w-full h-full">
                 {/* Wrapper for static rotation (Diamond shape) */}
                 <div 
                    className="w-full h-full"
                    style={{ transform: isChallenge ? 'rotate(45deg) scale(0.85)' : 'none' }}
                 >
                    <div 
                        className={`
                            relative flex items-center justify-center w-full h-full 
                            border-4 
                            ${!unlocked ? 'grayscale-[0.5]' : ''}
                        `}
                        style={{
                            backgroundColor: currentStyle.bg,
                            borderTopColor: currentStyle.light,
                            borderLeftColor: currentStyle.light,
                            borderBottomColor: currentStyle.dark,
                            borderRightColor: currentStyle.dark,
                            borderRadius: borderRadius,
                            boxShadow: `inset 0 0 20px rgba(0,0,0,0.25)`
                        }}
                    >
                        {/* Inner Decorative Inset */}
                        {!isGoal && (
                            <div className="absolute inset-1 border-2 border-black/10 pointer-events-none" style={{ borderRadius: '2px' }}></div>
                        )}

                        {/* 3. Icon Layer - Pops out even more */}
                        {/* We need to counter-rotate if it's a challenge so the icon stays upright */}
                        <CardItem 
                            translateZ="50" 
                            className="relative z-10 flex items-center justify-center"
                        >
                            <div style={{ transform: isChallenge ? 'rotate(-45deg)' : 'none' }}>
                                <LucideIcon 
                                    size={size} 
                                    color={unlocked ? '#FFFFFF' : '#444444'}
                                    strokeWidth={unlocked ? 3 : 2.5}
                                    className={`
                                        filter drop-shadow-md transition-all duration-300
                                        ${unlocked ? 'drop-shadow-[2px_2px_0px_rgba(0,0,0,0.6)]' : ''}
                                    `}
                                />
                            </div>
                        </CardItem>
                    </div>
                </div>
            </CardItem>

            {/* 4. Shine - Floating on top */}
            {unlocked && (
                <CardItem translateZ="60" className="absolute top-0 right-0 pointer-events-none">
                    <div 
                        className="w-3 h-3 bg-white opacity-20 rounded-full blur-[1px]"
                        style={{ transform: isChallenge ? 'translate(-12px, 12px)' : 'translate(-6px, 6px)' }}
                    />
                </CardItem>
            )}

        </CardBody>
    </CardContainer>
  );
};
