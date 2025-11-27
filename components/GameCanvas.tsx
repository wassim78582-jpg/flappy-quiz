import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GRAVITY, JUMP_STRENGTH, PIPE_SPEED, PIPE_SPAWN_RATE, GAP_SIZE, COLOR_SKY, COLOR_GROUND, COLOR_GRASS, COLOR_PIPE, COLOR_PIPE_DARK, SKINS } from '../constants';
import { SkinId } from '../types';

interface GameCanvasProps {
  skinId: SkinId;
  onCrash: () => void;
  isActive: boolean;
  onScore: (score: number) => void;
}

const GameCanvas: React.FC<GameCanvasProps> = ({ skinId, onCrash, isActive, onScore }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [score, setScore] = useState(0);

  const gameState = useRef({
    birdY: 200,
    birdVelocity: 0,
    pipes: [] as { x: number; topHeight: number; passed: boolean }[],
    frameCount: 0,
    isGameOver: false,
    groundOffset: 0,
    rotation: 0
  });

  const audioCtx = useRef<AudioContext | null>(null);

  const initAudio = () => {
    if (!audioCtx.current) {
      audioCtx.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtx.current.state === 'suspended') {
      audioCtx.current.resume();
    }
  };

  const playSound = (type: 'jump' | 'score' | 'crash') => {
    initAudio();
    const ctx = audioCtx.current;
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;

    if (type === 'jump') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(600, now + 0.1);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    } else if (type === 'score') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1000, now);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
    } else if (type === 'crash') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(50, now + 0.3);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    }
  };

  const resetGame = useCallback(() => {
    gameState.current = {
      birdY: 200,
      birdVelocity: 0,
      pipes: [],
      frameCount: 0,
      isGameOver: false,
      groundOffset: 0,
      rotation: 0
    };
    setScore(0);
    setGameStarted(false);
  }, []);

  const handleInput = (e: React.PointerEvent | React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Resume audio context if needed
    initAudio();

    if (gameState.current.isGameOver) return;
    
    if (!gameStarted) {
      setGameStarted(true);
    }
    
    gameState.current.birdVelocity = JUMP_STRENGTH;
    playSound('jump');
  };

  // Reset when activated
  useEffect(() => {
    if (isActive) {
      resetGame();
    }
  }, [isActive, resetGame]);

  // Game Loop
  useEffect(() => {
    if (!isActive) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    
    // Internal pixel art drawer
    const drawPixelMap = (ctx: CanvasRenderingContext2D, map: string[][], x: number, y: number, scale: number, rotation: number) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation);
      const width = map[0].length * scale;
      const height = map.length * scale;
      ctx.translate(-width / 2, -height / 2);
      
      for (let r = 0; r < map.length; r++) {
        for (let c = 0; c < map[r].length; c++) {
          const color = map[r][c];
          if (color) {
            ctx.fillStyle = color;
            ctx.fillRect(c * scale, r * scale, scale, scale);
          }
        }
      }
      ctx.restore();
    };

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      const groundY = height - 80;

      // Update Physics
      if (gameStarted && !gameState.current.isGameOver) {
        gameState.current.birdVelocity += GRAVITY;
        gameState.current.birdY += gameState.current.birdVelocity;
        gameState.current.rotation = Math.min(Math.PI / 4, Math.max(-Math.PI / 4, (gameState.current.birdVelocity * 0.1)));
        gameState.current.frameCount++;
        gameState.current.groundOffset = (gameState.current.groundOffset + PIPE_SPEED) % 24;

        // Pipe Spawning
        if (gameState.current.frameCount % PIPE_SPAWN_RATE === 0) {
            const minPipeHeight = 50;
            const maxPipeHeight = groundY - GAP_SIZE - minPipeHeight;
            const topHeight = Math.floor(Math.random() * (maxPipeHeight - minPipeHeight + 1)) + minPipeHeight;
            gameState.current.pipes.push({ x: width, topHeight, passed: false });
        }

        // Pipe Logic
        for (let i = gameState.current.pipes.length - 1; i >= 0; i--) {
          const pipe = gameState.current.pipes[i];
          pipe.x -= PIPE_SPEED;

          const birdRadius = 12; // Hitbox radius
          
          // Collision Check
          const hitPipe = 
            (pipe.x < width / 2 + birdRadius && pipe.x + 52 > width / 2 - birdRadius) &&
            (gameState.current.birdY - birdRadius < pipe.topHeight || gameState.current.birdY + birdRadius > pipe.topHeight + GAP_SIZE);

          if (hitPipe) {
             gameState.current.isGameOver = true;
             playSound('crash');
             onCrash();
          }

          // Scoring
          if (!pipe.passed && pipe.x + 52 < width / 2 - birdRadius) {
              pipe.passed = true;
              setScore(s => {
                  const newScore = s + 1;
                  onScore(newScore);
                  return newScore;
              });
              playSound('score');
          }

          if (pipe.x < -60) {
            gameState.current.pipes.splice(i, 1);
          }
        }

        // Ground/Ceiling Collision
        if (gameState.current.birdY >= groundY - 12) {
            gameState.current.isGameOver = true;
            playSound('crash');
            onCrash();
        }
        if (gameState.current.birdY <= 0) {
             gameState.current.birdY = 0;
             gameState.current.birdVelocity = 0;
        }

      } else if (!gameStarted) {
          // Idle Animation
          const time = Date.now() / 300;
          gameState.current.birdY = 200 + Math.sin(time) * 5;
          gameState.current.groundOffset = (gameState.current.groundOffset + PIPE_SPEED) % 24;
      }

      // --- Draw ---
      
      // Sky
      ctx.fillStyle = COLOR_SKY;
      ctx.fillRect(0, 0, width, height);

      // Clouds (Simple)
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.fillRect(50, 50, 60, 20);
      ctx.fillRect(70, 35, 40, 20);
      ctx.fillRect(200, 80, 80, 25);
      
      // Pipes
      gameState.current.pipes.forEach(pipe => {
          // Top Pipe
          ctx.fillStyle = COLOR_PIPE;
          ctx.fillRect(pipe.x, 0, 52, pipe.topHeight);
          ctx.strokeStyle = 'black';
          ctx.lineWidth = 2;
          ctx.strokeRect(pipe.x, -2, 52, pipe.topHeight + 2); // -2 to hide top border
          
          ctx.fillStyle = COLOR_PIPE_DARK; // Cap
          ctx.fillRect(pipe.x - 2, pipe.topHeight - 24, 56, 24);
          ctx.strokeRect(pipe.x - 2, pipe.topHeight - 24, 56, 24);

          // Bottom Pipe
          const bottomY = pipe.topHeight + GAP_SIZE;
          ctx.fillStyle = COLOR_PIPE;
          ctx.fillRect(pipe.x, bottomY, 52, groundY - bottomY);
          ctx.strokeRect(pipe.x, bottomY, 52, groundY - bottomY);
          
          ctx.fillStyle = COLOR_PIPE_DARK; // Cap
          ctx.fillRect(pipe.x - 2, bottomY, 56, 24);
          ctx.strokeRect(pipe.x - 2, bottomY, 56, 24);
      });

      // Ground
      ctx.fillStyle = COLOR_GROUND;
      ctx.fillRect(0, groundY, width, height - groundY);
      ctx.beginPath();
      ctx.moveTo(0, groundY);
      ctx.lineTo(width, groundY);
      ctx.stroke();

      // Grass Top
      ctx.fillStyle = COLOR_GRASS;
      ctx.fillRect(0, groundY, width, 12);
      ctx.strokeRect(0, groundY, width, 12);
      
      // Moving ground pattern
      ctx.fillStyle = '#d0c874';
      for(let i = -24; i < width + 24; i+= 24) {
          ctx.fillRect(i - gameState.current.groundOffset, groundY + 18, 20, 4);
      }

      // Bird
      const currentSkin = SKINS.find(s => s.id === skinId) || SKINS[0];
      drawPixelMap(ctx, currentSkin.pixelMap, width / 2, gameState.current.birdY, 3, gameState.current.rotation);

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isActive, gameStarted, skinId, onCrash, onScore]);

  return (
    <div 
      ref={containerRef}
      className="absolute inset-0 w-full h-full flex flex-col items-center justify-center bg-sky-300 touch-none select-none"
      onPointerDown={handleInput}
    >
       <canvas 
          ref={canvasRef} 
          width={320} 
          height={480} 
          className="h-full w-auto max-w-full object-contain"
          style={{ imageRendering: 'pixelated' }}
       />
       
       {/* Score Overlay */}
       <div className="absolute top-20 left-0 right-0 flex justify-center pointer-events-none">
          <span className="font-pixel text-5xl text-white drop-shadow-[4px_4px_0_rgba(0,0,0,1)] stroke-black" style={{WebkitTextStroke: '2px black'}}>
             {score}
          </span>
       </div>

       {/* Tap to Start Prompt */}
       {!gameStarted && (
           <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none text-center">
               <div className="font-pixel text-2xl text-white drop-shadow-[4px_4px_0_#000] animate-pulse whitespace-nowrap">
                   TAP TO FLY
               </div>
           </div>
       )}
    </div>
  );
};

export default GameCanvas;