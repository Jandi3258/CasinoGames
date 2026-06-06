import React, { useEffect, useRef, useMemo } from 'react';

const DEFAULT_HORSES = [
  { id: 'h1', name: 'Szybki Paweł', color: '#E11D48' },
  { id: 'h2', name: 'Pan Kopytnik', color: '#2563EB' },
  { id: 'h3', name: 'Rumak Rysiek', color: '#F59E0B' },
  { id: 'h4', name: 'Koń Jurka', color: '#0F766E' },
  { id: 'h5', name: 'Dziki Dyzek', color: '#7C3AED' },
  { id: 'h6', name: 'Wolny Jakub', color: '#D97706' },
];

const TOTAL_RACE_SECONDS = 30;
const FINISH_LINE_RATIO = 0.94;
const START_LINE_RATIO = 0.06;
const TRACK_PADDING_TOP = 10;
const TRACK_PADDING_BOTTOM = 35; 
const TRACK_PADDING = 10; 

const hash = (value) => {
  const x = Math.sin(value) * 10000;
  return x - Math.floor(x);
};

const smoothStep = (x) => x * x * (3 - 2 * x);

const noise1D = (value) => {
  const integer = Math.floor(value);
  const fraction = value - integer;
  const a = hash(integer);
  const b = hash(integer + 1);
  return a + (b - a) * smoothStep(fraction);
};

const clamp = (number, min, max) => Math.min(Math.max(number, min), max);

const getRaceOrder = (winnerId, horses = DEFAULT_HORSES) => {
  const winner = horses.find((horse) => horse.id === winnerId) ?? horses[0];
  const others = horses.filter((horse) => horse.id !== winner.id);
  return [winner, ...others];
};

const getFinishTimeForPlacement = (place) => {
  
  const finishSchedule = [27.0, 27.8, 28.6, 29.4, 30.2, 31.0];
  return finishSchedule[place] ?? 31.0;
};

const easeInOutCubic = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

const normalizeProgress = (value, min, max) => {
  if (value <= min) return 0;
  if (value >= max) return 1;
  return (value - min) / (max - min);
};

const getHorseProgress = (horseStableIndex, orderIndex, elapsedSeconds, horseMaxProgressRef = null, horseId = null, raceNumber = 0) => {
  const finishTime = getFinishTimeForPlacement(orderIndex);
  const t = elapsedSeconds;
  const T = finishTime;
  const normalizedTime = t / T;

  
  
  const waves = [
    { c: 0.35, k: 1, phi: hash((horseStableIndex + raceNumber * 100) * 1.1) * Math.PI * 2 },
    { c: 0.20, k: 2, phi: hash((horseStableIndex + raceNumber * 100) * 2.2) * Math.PI * 2 },
    { c: 0.15, k: 3, phi: hash((horseStableIndex + raceNumber * 100) * 3.3) * Math.PI * 2 },
  ];

  let progress = normalizedTime;

  for (const wave of waves) {
    const { c, k, phi } = wave;
    
    
    
    const deviation = (c / (2 * Math.PI * k)) * (Math.sin(2 * Math.PI * k * normalizedTime + phi) - Math.sin(phi));
    progress += deviation;
  }

  
  
  let finalProgress = Math.max(0, progress);

  if (horseMaxProgressRef && horseId) {
    const prevProgress = horseMaxProgressRef.current[horseId] || 0;
    finalProgress = Math.max(finalProgress, prevProgress); 
    horseMaxProgressRef.current[horseId] = finalProgress;
  }
  
  return finalProgress;
};


const drawTrackBackground = (ctx, width, height, elapsedSeconds, laneHeight) => {
  
  ctx.fillStyle = '#52B04E'; 
  ctx.fillRect(0, 0, width, height);

  
  ctx.save();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)'; 
  ctx.lineWidth = 1;
  const numLanes = DEFAULT_HORSES.length;
  for (let i = 0; i < numLanes; i++) {
    const y = TRACK_PADDING_TOP + i * laneHeight;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
  ctx.restore();

  
  const fenceHeight = 20;
  const fenceY = height - TRACK_PADDING; 
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, fenceY);
  ctx.lineTo(width, fenceY);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, fenceY - fenceHeight);
  ctx.lineTo(width, fenceY - fenceHeight);
  ctx.stroke();

  
  const postSpacing = 80;
  for (let x = 0; x < width; x += postSpacing) {
    ctx.beginPath();
    ctx.moveTo(x, fenceY - fenceHeight);
    ctx.lineTo(x, fenceY);
    ctx.stroke();
  }

};

const drawFinishLine = (ctx, startX, finishX, height) => {
  const stripeWidth = 10;
  const laneHeight = (height - TRACK_PADDING_TOP - TRACK_PADDING_BOTTOM) / DEFAULT_HORSES.length;
  ctx.save();
  
  
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  for (let y = TRACK_PADDING_TOP; y <= height - TRACK_PADDING_BOTTOM; y += laneHeight / 2) {
    ctx.fillRect(finishX - stripeWidth / 2, y, stripeWidth, laneHeight / 4);
  }

  ctx.restore();
};



const drawHorse = (ctx, x, y, laneHeight, horse, horseIndex, progress) => {
  const horseScale = laneHeight / 50; 
  const horseWidth = 45 * horseScale;
  const horseHeight = 35 * horseScale;
  const originX = x - horseWidth / 2;
  const originY = y + laneHeight / 2 - horseHeight / 2;

  ctx.save();
  ctx.translate(originX, originY);
  ctx.scale(horseScale, horseScale);

  ctx.fillStyle = horse.color;
  ctx.globalAlpha = 0.7; 
  
  
  ctx.beginPath();
  ctx.moveTo(28, 22);
  ctx.lineTo(29, 31);
  ctx.lineTo(26, 31);
  ctx.lineTo(24, 22);
  ctx.fill();

  
  ctx.beginPath();
  ctx.moveTo(12, 20);
  ctx.lineTo(10, 32);
  ctx.lineTo(7, 31);
  ctx.lineTo(9, 20);
  ctx.fill();
  
  ctx.globalAlpha = 1.0; 

  
  ctx.beginPath();
  
  
  ctx.moveTo(38, 8);
  ctx.lineTo(43, 11);
  ctx.lineTo(40, 15);
  
  
  ctx.lineTo(33, 18);
  ctx.lineTo(34, 22);
  
  
  ctx.lineTo(39, 32);
  ctx.lineTo(35, 34);
  ctx.lineTo(28, 23);
  
  
  ctx.lineTo(16, 23);
  
  
  ctx.lineTo(6, 34);
  ctx.lineTo(2, 32);
  ctx.lineTo(10, 20);
  
  
  ctx.lineTo(4, 14);
  
  
  ctx.lineTo(-2, 16);
  ctx.lineTo(0, 12);
  ctx.lineTo(4, 10);
  
  
  ctx.lineTo(12, 10);
  ctx.lineTo(24, 12);
  
  
  ctx.lineTo(30, 4);
  
  
  ctx.lineTo(31, 0);
  ctx.lineTo(34, 4);
  
  
  ctx.lineTo(37, 5);
  
  ctx.closePath();
  ctx.fill();

  
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(31, 5);
  ctx.lineTo(27, 10);
  ctx.lineTo(23, 13);
  ctx.stroke();

  
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(37, 9, 1.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#000000';
  ctx.beginPath();
  ctx.arc(37.5, 9, 0.8, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();

  
  ctx.save();
  ctx.fillStyle = '#F8FAFC'; 
  ctx.font = '600 12px Inter, system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(horse.name, x + horseWidth / 2 + 5, y + laneHeight / 2 - 8); 

  if (progress && progress > 0.99) {
    ctx.font = '800 14px Inter, system-ui, sans-serif';
    ctx.fillStyle = '#FFD700'; 
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 4;
    const placeText = `${horseIndex + 1}. miejsce`;
    ctx.fillText(placeText, x + horseWidth / 2 + 5, y + laneHeight / 2 + 10); 
  }
  ctx.restore();
};



const RaceTrack = ({ gameState, horses = DEFAULT_HORSES, initialElapsed = 0, raceOutcome = null, raceNumber = 0, winnerId, sharedProgressRef }) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const startTimeRef = useRef(null);
  const elapsedRef = useRef(0);
  const maxPanProgressRef = useRef(0); 
  const fallbackProgressRef = useRef({}); 
  const horseMaxProgressRef = sharedProgressRef || fallbackProgressRef;

  const prevGameStateRef = useRef(gameState);
  const intendedOrder = useMemo(() => getRaceOrder(winnerId, horses), [winnerId, horses]);

  

  const drawFrame = (ctx, width, height, elapsedSeconds) => {
    
    const laneHeight = (height - TRACK_PADDING_TOP - TRACK_PADDING_BOTTOM) / horses.length;
    drawTrackBackground(ctx, width, height, elapsedSeconds, laneHeight);

    const startX = width * START_LINE_RATIO;
    const finishX = width * FINISH_LINE_RATIO;
    const trackWidth = finishX - startX;

    
    const getActualOrderIndex = (horseId) => {
      if (raceOutcome && raceOutcome.order) {
        return raceOutcome.order.findIndex(h => h.id === horseId);
      }
      return intendedOrder.findIndex(h => h.id === horseId);
    };

    const leadingHorseProgress = Math.max(...horses.map((horse, index) => {
      const actualOrderIndex = getActualOrderIndex(horse.id); 
      const currentProgress = getHorseProgress(index, actualOrderIndex, elapsedSeconds, horseMaxProgressRef, horse.id, raceNumber);
      return currentProgress;
    }));

    
    if (leadingHorseProgress > maxPanProgressRef.current) {
      maxPanProgressRef.current = leadingHorseProgress;
    }

    
    const targetPanX = startX + maxPanProgressRef.current * trackWidth;
    const pan = clamp(targetPanX - width * 0.62, 0, startX * 0.8);

    const focusZoom = gameState === 'photo-finish' ? 1.06 : 1;
    const zoomShift = gameState === 'photo-finish' ? Math.min((elapsedSeconds / TOTAL_RACE_SECONDS) * 30, 30) : 0;
    const focusShift = gameState === 'photo-finish' ? Math.max(finishX - width * 0.72, 0) : 0;

    ctx.save();
    if (gameState === 'photo-finish') {
      ctx.translate(-(focusShift + zoomShift), 0);
      ctx.scale(focusZoom, focusZoom);
    }
    ctx.translate(-pan, 0);

    drawFinishLine(ctx, startX, finishX, height);

    ctx.save();
    horses.forEach((horse, index) => {
      const laneY = TRACK_PADDING_TOP + index * laneHeight;

      const actualOrderIndex = getActualOrderIndex(horse.id); 
      const progress = horseMaxProgressRef.current[horse.id] || 0;
      const x = startX + progress * trackWidth;
      drawHorse(ctx, x, laneY, laneHeight, horse, actualOrderIndex, progress);
    });
    ctx.restore();
    
    if (gameState === 'photo-finish') {
      ctx.save();
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      ctx.fillRect(finishX - 100, 0, 200, height);
      ctx.restore();
    }
    ctx.restore();
  };

  const drawStatic = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { width, height } = canvas;
    ctx.clearRect(0, 0, width, height);
    
    const laneHeight = (height - TRACK_PADDING_TOP - TRACK_PADDING_BOTTOM) / horses.length;
    drawTrackBackground(ctx, width, height, 0, laneHeight);
    const startX = width * START_LINE_RATIO;
    const finishX = width * FINISH_LINE_RATIO;
    const trackWidth = finishX - startX;

    drawFinishLine(ctx, startX, finishX, height);
    horses.forEach((horse, index) => { 
      const laneY = TRACK_PADDING_TOP + index * laneHeight;
      
      const x = startX + 0.02 * trackWidth;
      drawHorse(ctx, x, laneY, laneHeight, horse, index, 0.02); 
    });
    
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      drawStatic();
    };

    resize();
    window.addEventListener('resize', resize);

    return () => {
      window.removeEventListener('resize', resize);
    };
  }, [horses, gameState, raceOutcome]); 

  const initialElapsedRef = useRef(initialElapsed);
  
  useEffect(() => {
    initialElapsedRef.current = initialElapsed;
  }, [initialElapsed]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let rafId;

    // Resetuj zegar, jeśli zmieniła się faza (np. z racing na photo-finish)
    if (prevGameStateRef.current !== gameState) {
      startTimeRef.current = null;
      prevGameStateRef.current = gameState;
    }

    const tick = (time) => {
      if (!startTimeRef.current) {
        startTimeRef.current = time - (initialElapsedRef.current * 1000);
        horseMaxProgressRef.current = {}; 
      }
      const elapsedSeconds = (time - startTimeRef.current) / 1000;
      elapsedRef.current = elapsedSeconds;
      const clamped = Math.min(elapsedSeconds, TOTAL_RACE_SECONDS);
      drawFrame(ctx, canvas.width / (window.devicePixelRatio || 1), canvas.height / (window.devicePixelRatio || 1), clamped);
      if (clamped < TOTAL_RACE_SECONDS) {
        rafId = requestAnimationFrame(tick);
        animationRef.current = rafId;
      }
    };

    if (gameState === 'racing' || gameState === 'photo-finish') {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      
      if (gameState === 'racing' && startTimeRef.current === null) {
        maxPanProgressRef.current = 0;
        horseMaxProgressRef.current = {};
      }
      rafId = requestAnimationFrame(tick);
      animationRef.current = rafId;

    } else {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      startTimeRef.current = null;
      elapsedRef.current = 0;
      maxPanProgressRef.current = 0;
      horseMaxProgressRef.current = {};
      drawStatic();
    }

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [gameState, horses, raceOutcome]); 

  return (
    <div className="rounded-[2rem] border border-zinc-800 bg-slate-950 p-3 shadow-2xl">
      <canvas ref={canvasRef} className="h-[520px] w-full rounded-[1.5rem] bg-[#020617]" />
    </div>
  );
};

export { getHorseProgress, getRaceOrder };
export default RaceTrack;
