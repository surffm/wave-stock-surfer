import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Sparkles, Zap, TrendingUp, Info, Plus, X } from 'lucide-react';

const WaveStockSurfer = () => {
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [multiplier, setMultiplier] = useState(1);
  const [showMission, setShowMission] = useState(false);
  const [powerUp, setPowerUp] = useState(null);
  const [celebration, setCelebration] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newStock, setNewStock] = useState({ symbol: '', color: '#60A5FA' });
  const [isMobile, setIsMobile] = useState(false);
  
  const characters = useMemo(() => [
  { id: 'goku', name: 'Wave Warrior', emoji: '🏄‍♂️', unlocked: true, color: '#FF6B35', invertDirection: false },
  { id: 'vegeta', name: 'Storm Rider', emoji: '🥷', unlocked: true, color: '#4ECDC4', invertDirection: true },
  { id: 'gohan', name: 'Tide Master', emoji: '🧙‍♂️', unlocked: false, unlock: 'Reach 5 streak', color: '#FFE66D', invertDirection: true },
  { id: 'piccolo', name: 'Foam Ninja', emoji: '🦸‍♂️', unlocked: false, unlock: 'Score 1000+', color: '#95E1D3', invertDirection: true },
  { id: 'trunks', name: 'Crest Legend', emoji: '⚡', unlocked: false, unlock: 'Get 3 power-ups', color: '#F38181', invertDirection: true },
  { id: 'krillin', name: 'Beach Boss', emoji: '🌟', unlocked: false, unlock: 'Reach 10 streak', color: '#AA96DA', invertDirection: false },
  { id: 'dolphin', name: 'Wave Dolphin', emoji: '🐬', unlocked: false, unlock: 'Get 3 power-ups', color: '#3BA3FF', invertDirection: false },
  { id: 'cat', name: 'Surf Cat', emoji: '🐱', unlocked: false, unlock: 'Score 5000+', color: '#F6A5C0', invertDirection: false },
  { id: 'unicorn', name: 'Magic Unicorn', emoji: '🦄', unlocked: false, unlock: 'Collect 10 power-ups', color: '#D98FFF', invertDirection: false },
  { id: 'wolf', name: 'Lone Wolf Rider', emoji: '🐺', unlocked: false, unlock: 'Get 3 power-ups', color: '#6E8B8E', invertDirection: false }
], []);

  const colors = useMemo(() => ['#60A5FA', '#34D399', '#F87171', '#FBBF24', '#A78BFA', '#EC4899', '#14B8A6'], []);
  const [unlockedChars, setUnlockedChars] = useState(['goku', 'vegeta']);
  const [powerUpCount, setPowerUpCount] = useState(0);
  
  const generatePriceHistory = useCallback((basePrice, volatility, points) => {
    const history = [basePrice];
    for (let i = 1; i < points; i++) {
      const change = (Math.random() - 0.48) * volatility;
      history.push(history[i - 1] * (1 + change));
    }
    return history;
  }, []);
  
  const initialStocks = useMemo(() => [
    { symbol: 'GME', color: '#EC4899', history: generatePriceHistory(25, 0.045, 50), selectedChar: 'goku' },
    { symbol: 'AAPL', color: '#60A5FA', history: generatePriceHistory(170, 0.02, 50), selectedChar: 'vegeta' },
    { symbol: 'GOOGL', color: '#34D399', history: generatePriceHistory(140, 0.025, 50), selectedChar: 'goku' },
    { symbol: 'TSLA', color: '#F87171', history: generatePriceHistory(250, 0.04, 50), selectedChar: 'vegeta' }
  ], [generatePriceHistory]);
  
  const [stocks, setStocks] = useState(initialStocks);
  const [selectedStock, setSelectedStock] = useState('GME');
  const [selectedChars, setSelectedChars] = useState({ GME: 'goku', AAPL: 'vegeta', GOOGL: 'goku', TSLA: 'vegeta' });
  const [surferPositions, setSurferPositions] = useState(stocks.reduce((acc, stock) => ({ ...acc, [stock.symbol]: { x: 0.3, y: 0.5, jumping: false, hasRocket: false, direction: 1 } }), {}));
  const [rockets, setRockets] = useState(stocks.reduce((acc, stock) => ({ ...acc, [stock.symbol]: [] }), {}));
  const [waterTrails, setWaterTrails] = useState(stocks.reduce((acc, stock) => ({ ...acc, [stock.symbol]: [] }), {}));
  const [cutbackSplashes, setCutbackSplashes] = useState(stocks.reduce((acc, stock) => ({ ...acc, [stock.symbol]: [] }), {}));
  const canvasRefs = useRef({});
  const cardRefs = useRef({});
  const timeRef = useRef(0);
  const keysPressed = useRef({});
  const previousX = useRef({});
  
  useEffect(() => {
    const checkMobile = () => setIsMobile('ontouchstart' in window || navigator.maxTouchPoints > 0);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  const [targetPositions, setTargetPositions] = useState(stocks.reduce((acc, stock) => ({ ...acc, [stock.symbol]: null }), {}));
  const touchingRef = useRef(false);
  const currentTouchStock = useRef(null);
  
  const handleStockCardTouch = useCallback((e, stockSymbol) => {
    if (stockSymbol !== selectedStock) return;
    e.preventDefault();
    const canvas = canvasRefs.current[stockSymbol];
    if (!canvas) return;
    const canvasRect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const normalizedX = Math.max(0.05, Math.min(0.95, (clientX - canvasRect.left) / canvasRect.width));
    const normalizedY = Math.max(0.1, Math.min(1.5, (clientY - canvasRect.top) / canvasRect.height));
    setTargetPositions(prev => ({ ...prev, [stockSymbol]: { x: normalizedX, y: normalizedY } }));
    touchingRef.current = true;
    currentTouchStock.current = stockSymbol;
  }, [selectedStock]);
  
  const handleCanvasTouchEnd = useCallback(() => {
    touchingRef.current = false;
    currentTouchStock.current = null;
  }, []);
  
  const handleJump = () => {
    if (selectedStock) {
      setSurferPositions(prev => ({ ...prev, [selectedStock]: { ...prev[selectedStock], jumping: true } }));
      setTimeout(() => setSurferPositions(prev => ({ ...prev, [selectedStock]: { ...prev[selectedStock], jumping: false } })), 600);
    }
  };
  
  useEffect(() => {
    const handleKeyDown = (e) => {
      keysPressed.current[e.key] = true;
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault();
      if (e.key === ' ' && selectedStock) handleJump();
    };
    const handleKeyUp = (e) => { keysPressed.current[e.key] = false; };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [selectedStock]);
  
  const createCutbackSplash = useCallback((stockSymbol, x, y) => {
    const canvas = canvasRefs.current[stockSymbol];
    if (!canvas) return;
    const stock = stocks.find(s => s.symbol === stockSymbol);
    if (!stock) return;
    const width = canvas.width;
    const height = canvas.height;
    const history = stock.history;
    const minPrice = Math.min(...history);
    const maxPrice = Math.max(...history);
    const priceRange = maxPrice - minPrice || 1;
    const normalizePrice = (price) => height * 0.8 - ((price - minPrice) / priceRange) * height * 0.5;
    const historyIndex = x * (history.length - 1);
    const index = Math.floor(historyIndex);
    const nextIndex = Math.min(index + 1, history.length - 1);
    const t = historyIndex - index;
    const price = history[index] * (1 - t) + history[nextIndex] * t;
    let baseY = normalizePrice(price) + Math.sin(x * Math.PI * 4 - timeRef.current * 0.06) * 8;
    const splashX = x * width;
    const splashY = baseY + (y - 0.5) * height * 0.8;
    const particles = [];
    for (let i = 0; i < 25; i++) {
      const angle = (Math.random() * Math.PI) - Math.PI / 2;
      const speed = Math.random() * 8 + 6;
      particles.push({ id: Date.now() + Math.random(), x: splashX, y: splashY, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 3, life: 1, size: Math.random() * 5 + 3 });
    }
    setCutbackSplashes(prev => ({ ...prev, [stockSymbol]: [...prev[stockSymbol], ...particles] }));
  }, [stocks]);
  
  useEffect(() => {
    const moveInterval = setInterval(() => {
      if (!selectedStock) return;
      setSurferPositions(prev => {
        const current = prev[selectedStock];
        let newX = current.x;
        let newY = current.y;
        let newDirection = current.direction;
        if (previousX.current[selectedStock] === undefined) previousX.current[selectedStock] = current.x;
        const stock = stocks.find(s => s.symbol === selectedStock);
        if (stock && !current.jumping) {
          const canvas = canvasRefs.current[selectedStock];
          if (canvas) {
            const height = canvas.height;
            const history = stock.history;
            const minPrice = Math.min(...history);
            const maxPrice = Math.max(...history);
            const priceRange = maxPrice - minPrice || 1;
            const normalizePrice = (price) => height * 0.8 - ((price - minPrice) / priceRange) * height * 0.5;
            const historyIndex = current.x * (history.length - 1);
            const index = Math.floor(historyIndex);
            const nextIndex = Math.min(index + 1, history.length - 1);
            const t = historyIndex - index;
            const price = history[index] * (1 - t) + history[nextIndex] * t;
            const waveY = normalizePrice(price) + Math.sin(current.x * Math.PI * 4 - timeRef.current * 0.06) * 8;
            const waveNormalizedY = 0.5 + ((waveY - (height * 0.5)) / (height * 0.8));
            newY = Math.max(waveNormalizedY, newY);
          }
        }
        const target = targetPositions[selectedStock];
        if (target) {
          const deltaX = target.x - current.x;
          const deltaY = target.y - current.y;
          const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
          if (distance > 0.005) {
            const speed = 0.08;
            newX = current.x + (deltaX / distance) * Math.min(speed, distance);
            const xDiff = newX - previousX.current[selectedStock];
            if (xDiff > 0) { if (newDirection === -1) createCutbackSplash(selectedStock, newX, current.y); newDirection = 1; }
            else if (xDiff < 0) { if (newDirection === 1) createCutbackSplash(selectedStock, newX, current.y); newDirection = -1; }
            let targetY = current.y + (deltaY / distance) * Math.min(speed, distance);
            if (!current.jumping && stock) {
              const canvas = canvasRefs.current[selectedStock];
              if (canvas) {
                const height = canvas.height;
                const history = stock.history;
                const minPrice = Math.min(...history);
                const maxPrice = Math.max(...history);
                const priceRange = maxPrice - minPrice || 1;
                const normalizePrice = (price) => height * 0.8 - ((price - minPrice) / priceRange) * height * 0.5;
                const historyIndex = newX * (history.length - 1);
                const index = Math.floor(historyIndex);
                const nextIndex = Math.min(index + 1, history.length - 1);
                const t = historyIndex - index;
                const price = history[index] * (1 - t) + history[nextIndex] * t;
                const waveY = normalizePrice(price) + Math.sin(newX * Math.PI * 4 - timeRef.current * 0.06) * 8;
                const waveNormalizedY = 0.5 + ((waveY - (height * 0.5)) / (height * 0.8));
                targetY = Math.max(waveNormalizedY, targetY);
              }
            }
            newY = targetY;
          } else if (!touchingRef.current || currentTouchStock.current !== selectedStock) {
            setTargetPositions(prev => ({ ...prev, [selectedStock]: null }));
          }
        }
        if (keysPressed.current['ArrowLeft']) {
          const oldX = newX;
          newX = Math.max(0.05, newX - 0.02);
          if (newX < oldX && newDirection === 1) createCutbackSplash(selectedStock, newX, current.y);
          if (newX < oldX) newDirection = -1;
          setTargetPositions(prev => ({ ...prev, [selectedStock]: null }));
        }
        if (keysPressed.current['ArrowRight']) {
          const oldX = newX;
          newX = Math.min(0.95, newX + 0.02);
          if (newX > oldX && newDirection === -1) createCutbackSplash(selectedStock, newX, current.y);
          if (newX > oldX) newDirection = 1;
          setTargetPositions(prev => ({ ...prev, [selectedStock]: null }));
        }
        if (keysPressed.current['ArrowUp']) { newY = Math.max(current.hasRocket ? -0.2 : 0.5, newY - 0.02); setTargetPositions(prev => ({ ...prev, [selectedStock]: null })); }
        if (keysPressed.current['ArrowDown']) { newY = Math.min(1.5, newY + 0.02); setTargetPositions(prev => ({ ...prev, [selectedStock]: null })); }
        previousX.current[selectedStock] = newX;
        return { ...prev, [selectedStock]: { ...current, x: newX, y: newY, direction: newDirection } };
      });
    }, 16);
    return () => clearInterval(moveInterval);
  }, [selectedStock, targetPositions, stocks, createCutbackSplash]);
  
  useEffect(() => {
    const trailInterval = setInterval(() => {
      stocks.forEach(stock => {
        const surferPos = surferPositions[stock.symbol];
        const canvas = canvasRefs.current[stock.symbol];
        if (!canvas || !surferPos) return;
        const width = canvas.width;
        const height = canvas.height;
        const history = stock.history;
        const minPrice = Math.min(...history);
        const maxPrice = Math.max(...history);
        const priceRange = maxPrice - minPrice || 1;
        const normalizePrice = (price) => height * 0.8 - ((price - minPrice) / priceRange) * height * 0.5;
        const historyIndex = surferPos.x * (history.length - 1);
        const index = Math.floor(historyIndex);
        const nextIndex = Math.min(index + 1, history.length - 1);
        const t = historyIndex - index;
        const price = history[index] * (1 - t) + history[nextIndex] * t;
        const baseY = normalizePrice(price) + Math.sin(surferPos.x * Math.PI * 4 - timeRef.current * 0.06) * 8;
        const surferX = surferPos.x * width;
        const surferY = baseY - 15 + (surferPos.jumping ? -30 : 0) + (surferPos.y - 0.5) * height * 0.8;
        for (let i = 0; i < 2; i++) {
          const spreadAngle = (Math.random() - 0.5) * Math.PI / 3;
          const speed = Math.random() * 3 + 2;
          setWaterTrails(prev => ({ ...prev, [stock.symbol]: [...prev[stock.symbol], {
            id: Date.now() + Math.random(), x: surferX, y: surferY,
            vx: Math.cos(Math.PI + spreadAngle) * speed, vy: Math.sin(Math.PI + spreadAngle) * speed - 2,
            life: 1, size: Math.random() * 3 + 2
          }].slice(-30) }));
        }
      });
    }, 50);
    return () => clearInterval(trailInterval);
  }, [stocks, surferPositions]);
  
  useEffect(() => {
    const newUnlocked = [...unlockedChars];
    if (streak >= 5 && !newUnlocked.includes('gohan')) { newUnlocked.push('gohan'); setCelebration(true); setTimeout(() => setCelebration(false), 2000); }
    if (score >= 1000 && !newUnlocked.includes('piccolo')) { newUnlocked.push('piccolo'); setCelebration(true); setTimeout(() => setCelebration(false), 2000); }
    if (powerUpCount >= 3 && !newUnlocked.includes('trunks')) { newUnlocked.push('trunks'); setCelebration(true); setTimeout(() => setCelebration(false), 2000); }
    if (streak >= 10 && !newUnlocked.includes('krillin')) { newUnlocked.push('krillin'); setCelebration(true); setTimeout(() => setCelebration(false), 2000); }
    if (streak >= 20 && !newUnlocked.includes('dolphin')) { newUnlocked.push('dolphin'); setCelebration(true); setTimeout(() => setCelebration(false), 2000); }
    if (score >= 5000 && !newUnlocked.includes('cat')) { newUnlocked.push('cat'); setCelebration(true); setTimeout(() => setCelebration(false), 2000); }
    if (powerUpCount >= 10 && !newUnlocked.includes('unicorn')) { newUnlocked.push('unicorn'); setCelebration(true); setTimeout(() => setCelebration(false), 2000); }
    if (streak >= 15 && !newUnlocked.includes('wolf')) { newUnlocked.push('wolf'); setCelebration(true); setTimeout(() => setCelebration(false), 2000); }
    setUnlockedChars(newUnlocked);
  }, [streak, score, powerUpCount, unlockedChars]);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setScore(s => s + (Math.floor(Math.random() * 50) + 20) * multiplier);
      if (Math.random() > 0.3) {
        setStreak(s => {
          const newStreak = s + 1;
          if (newStreak % 5 === 0) { setMultiplier(m => Math.min(m + 0.5, 5)); setCelebration(true); setTimeout(() => setCelebration(false), 1500); }
          return newStreak;
        });
      } else { setStreak(0); setMultiplier(1); }
      if (Math.random() > 0.85) {
        setPowerUp(['speed', 'glow', 'foam', 'multiplier'][Math.floor(Math.random() * 4)]);
        setPowerUpCount(c => c + 1);
        setTimeout(() => setPowerUp(null), 3000);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [multiplier]);
  
  const drawWave = useCallback((canvas, stock, time) => {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);
    const history = stock.history;
    const minPrice = Math.min(...history);
    const maxPrice = Math.max(...history);
    const priceRange = maxPrice - minPrice || 1;
    const normalizePrice = (price) => height * 0.8 - ((price - minPrice) / priceRange) * height * 0.5;
    const offset = time * 0.02;
    const points = [];
    for (let i = 0; i < 60; i++) {
      const x = (i / 60) * width;
      const progress = i / 60;
      const historyIndex = progress * (history.length - 1);
      const index = Math.floor(historyIndex);
      const nextIndex = Math.min(index + 1, history.length - 1);
      const t = historyIndex - index;
      const price = history[index] * (1 - t) + history[nextIndex] * t;
      const y = normalizePrice(price) + Math.sin(progress * Math.PI * 4 - offset * 3) * 8 + Math.sin(x * 0.3 + time * 0.5) * 2;
      points.push({ x, y });
    }
    let crestIndex = 0;
    let highestY = height;
    points.forEach((point, i) => { if (point.y < highestY) { highestY = point.y; crestIndex = i; } });
    for (let layer = 0; layer < 3; layer++) {
      ctx.beginPath();
      points.forEach((point, i) => {
        if (i === 0) ctx.moveTo(point.x, point.y + layer * 5);
        else ctx.lineTo(point.x, point.y + layer * 5);
      });
      ctx.lineTo(width, height);
      ctx.lineTo(0, height);
      ctx.closePath();
      const opacity = 0.25 - layer * 0.05;
      ctx.fillStyle = stock.color + Math.floor(opacity * 255).toString(16).padStart(2, '0');
      ctx.fill();
      ctx.beginPath();
      points.forEach((point, i) => {
        if (i === 0) ctx.moveTo(point.x, point.y + layer * 5);
        else ctx.lineTo(point.x, point.y + layer * 5);
      });
      ctx.strokeStyle = stock.color + Math.floor((opacity + 0.3) * 255).toString(16).padStart(2, '0');
      ctx.lineWidth = 3;
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    for (let i = Math.max(0, crestIndex - 3); i < Math.min(points.length, crestIndex + 6); i++) {
      for (let j = 0; j < 3; j++) {
        ctx.beginPath();
        ctx.arc(points[i].x + (Math.random() - 0.5) * 15, points[i].y - Math.random() * 15, Math.random() * 2 + 1, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    const surferPos = surferPositions[stock.symbol];
    const surferIndex = Math.floor(surferPos.x * (points.length - 1));
    const surferPoint = points[surferIndex];
    const prevPoint = points[Math.max(0, surferIndex - 1)];
    const angle = Math.atan2(surferPoint.y - prevPoint.y, surferPoint.x - prevPoint.x);
    const char = characters.find(c => c.id === selectedChars[stock.symbol]);
    ctx.save();
    ctx.translate(surferPoint.x, surferPoint.y - 15 + (surferPos.jumping ? -30 : 0) + (surferPos.y - 0.5) * height * 0.8);
    ctx.rotate(angle);
    const shouldFlip = char?.invertDirection ? (surferPos.direction === -1) : (surferPos.direction === 1);
    if (shouldFlip) ctx.scale(-1, 1);
    if (stock.symbol === selectedStock) { ctx.shadowBlur = 25; ctx.shadowColor = '#00FF00'; }
    ctx.font = '32px Arial';
    ctx.fillText(char?.emoji || '🏄‍♂️', -16, 8);
    ctx.restore();
    (waterTrails[stock.symbol] || []).forEach(particle => {
      ctx.globalAlpha = particle.life;
      ctx.fillStyle = '#60A5FA';
      ctx.shadowBlur = 5;
      ctx.shadowColor = '#60A5FA';
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
    });
    (cutbackSplashes[stock.symbol] || []).forEach(particle => {
      ctx.globalAlpha = particle.life;
      ctx.fillStyle = '#FFFFFF';
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#60A5FA';
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
    });
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = 'bold 12px Arial';
    const startPrice = history[0];
    const endPrice = history[history.length - 1];
    const priceChange = ((endPrice - startPrice) / startPrice * 100).toFixed(2);
    ctx.fillText(`Start: $${startPrice.toFixed(2)}`, 10, 20);
    ctx.fillText(`Now: $${endPrice.toFixed(2)}`, width - 120, 20);
    ctx.fillStyle = priceChange >= 0 ? '#34D399' : '#F87171';
    ctx.fillText(`${priceChange}%`, width / 2 - 20, 20);
  }, [surferPositions, selectedChars, characters, selectedStock, waterTrails, cutbackSplashes]);
  
  useEffect(() => {
    let animationFrame;
    const animate = () => {
      timeRef.current += 0.1;
      setWaterTrails(prev => {
        const updated = {};
        Object.keys(prev).forEach(symbol => {
          updated[symbol] = prev[symbol].map(p => ({ ...p, x: p.x + p.vx, y: p.y + p.vy, vy: p.vy + 0.2, life: p.life - 0.02 })).filter(p => p.life > 0);
        });
        return updated;
      });
      setCutbackSplashes(prev => {
        const updated = {};
        Object.keys(prev).forEach(symbol => {
          updated[symbol] = prev[symbol].map(p => ({ ...p, x: p.x + p.vx, y: p.y + p.vy, vy: p.vy + 0.3, vx: p.vx * 0.98, life: p.life - 0.015 })).filter(p => p.life > 0);
        });
        return updated;
      });
      stocks.forEach(stock => drawWave(canvasRefs.current[stock.symbol], stock, timeRef.current));
      animationFrame = requestAnimationFrame(animate);
    };
    animate();
    return () => cancelAnimationFrame(animationFrame);
  }, [stocks, drawWave]);
  
  const selectCharacter = useCallback((stockSymbol, charId) => {
    if (unlockedChars.includes(charId)) setSelectedChars(prev => ({ ...prev, [stockSymbol]: charId }));
  }, [unlockedChars]);
  
  const getCharacter = useCallback((charId) => characters.find(c => c.id === charId), [characters]);

  const handleAddStock = useCallback(() => {
    if (newStock.symbol) {
      const basePrice = Math.random() * 200 + 50;
      const newStockData = {
        symbol: newStock.symbol.toUpperCase(),
        color: newStock.color,
        history: generatePriceHistory(basePrice, 0.03, 50),
        selectedChar: 'goku'
      };
      
      setStocks(prev => [...prev, newStockData]);
      setSelectedChars(prev => ({ ...prev, [newStock.symbol.toUpperCase()]: 'goku' }));
      setSurferPositions(prev => ({ 
        ...prev, 
        [newStock.symbol.toUpperCase()]: { x: 0.3, y: 0.5, jumping: false, hasRocket: false, direction: 1 }
      }));
      setRockets(prev => ({ ...prev, [newStock.symbol.toUpperCase()]: [] }));
      setWaterTrails(prev => ({ ...prev, [newStock.symbol.toUpperCase()]: [] }));
      setCutbackSplashes(prev => ({ ...prev, [newStock.symbol.toUpperCase()]: [] }));
      setTargetPositions(prev => ({ ...prev, [newStock.symbol.toUpperCase()]: null }));
      
      setNewStock({ symbol: '', color: colors[stocks.length % colors.length] });
      setShowAddForm(false);
    }
  }, [newStock, colors, stocks.length, generatePriceHistory]);

  const removeStock = useCallback((symbol) => {
    setStocks(prev => prev.filter(s => s.symbol !== symbol));
    setSelectedChars(prev => {
      const newChars = { ...prev };
      delete newChars[symbol];
      return newChars;
    });
    setSurferPositions(prev => {
      const newPos = { ...prev };
      delete newPos[symbol];
      return newPos;
    });
    setRockets(prev => {
      const newRockets = { ...prev };
      delete newRockets[symbol];
      return newRockets;
    });
    setWaterTrails(prev => {
      const newTrails = { ...prev };
      delete newTrails[symbol];
      return newTrails;
    });
    setCutbackSplashes(prev => {
      const newSplashes = { ...prev };
      delete newSplashes[symbol];
      return newSplashes;
    });
    setTargetPositions(prev => {
      const newTargets = { ...prev };
      delete newTargets[symbol];
      return newTargets;
    });
    if (selectedStock === symbol) {
      setSelectedStock(stocks[0]?.symbol || null);
    }
  }, [selectedStock, stocks]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-6 pb-32">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-5xl font-bold text-white mb-2 flex items-center justify-center gap-3">
            🏄‍♂️ Wave Stock Surfer 🌊
          </h1>
          <p className="text-blue-200 text-lg">
            {isMobile ? 'Touch & hold the wave to surf! Tap jump button to jump!' : 'Use arrow keys to carve, SPACE to jump!'}
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-blue-200 font-medium">Score</span>
                <span className="text-2xl font-bold text-blue-400">{score.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-blue-200 font-medium flex items-center gap-1">
                  <TrendingUp size={16} />
                  Streak
                </span>
                <span className="text-xl font-bold text-orange-400">{streak}🔥</span>
              </div>
              {multiplier > 1 && (
                <div className="flex items-center justify-between animate-pulse">
                  <span className="text-blue-200 font-medium flex items-center gap-1">
                    <Sparkles size={16} />
                    Multiplier
                  </span>
                  <span className="text-xl font-bold text-purple-400">×{multiplier}</span>
                </div>
              )}
              {powerUp && (
                <div className="bg-yellow-400/20 border-2 border-yellow-400 rounded-lg p-2 animate-pulse">
                  <div className="flex items-center gap-2 text-yellow-300 font-bold text-sm">
                    <Zap size={16} />
                    {powerUp.toUpperCase()} BOOST!
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
            <h2 className="text-xl font-bold text-white mb-3">Controls</h2>
            <div className="space-y-3">
              {isMobile ? (
                <>
                  <div className="flex items-center gap-2 text-sm text-blue-200">
                    <span className="px-3 py-1 bg-white/20 rounded">👆 Touch & Hold</span>
                    <span>Surf anywhere! 💧</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-blue-200">
                    <span className="px-3 py-1 bg-white/20 rounded">⬆️ Button</span>
                    <span>Jump!</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2 text-sm text-blue-200">
                    <kbd className="px-2 py-1 bg-white/20 rounded">←</kbd>
                    <kbd className="px-2 py-1 bg-white/20 rounded">→</kbd>
                    <span>Move & See Water Spray! 💧</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-blue-200">
                    <kbd className="px-2 py-1 bg-white/20 rounded">↑</kbd>
                    <kbd className="px-2 py-1 bg-white/20 rounded">↓</kbd>
                    <span>Carve Up/Down Wave</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-blue-200">
                    <kbd className="px-3 py-1 bg-white/20 rounded">SPACE</kbd>
                    <span>Jump!</span>
                  </div>
                </>
              )}
              <div className="flex items-center gap-2 text-sm text-blue-200">
                <span className="text-green-400 font-bold">● {selectedStock}</span>
                <span>← Selected (click wave)</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="text-center mb-6">
          <button
            onClick={() => setShowMission(!showMission)}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-2 rounded-full flex items-center gap-2 mx-auto transition-all shadow-lg"
          >
            <Info size={20} />
            {showMission ? 'Hide' : 'Show'} Mission
          </button>
        </div>
        
        {showMission && (
          <div className="mb-6 bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-3xl p-6 shadow-2xl">
            <h2 className="text-3xl font-bold mb-3 flex items-center gap-2">
              🌊 Our Mission 🏄‍♂️
            </h2>
            <div className="space-y-3 text-base">
              <p><strong>Make watching the stock market relaxing, playful, and fun</strong> — like riding waves at the beach! 🏖️</p>
              <p>No more stressful red and green candles. Watch stocks flow as beautiful ocean waves with surfers you can control! 🥷⚡</p>
              <p>NEW: Cool water spray trails behind your surfer! 💧✨</p>
            </div>
          </div>
        )}
        
        {celebration && (
          <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center">
            <div className="text-8xl animate-bounce">🎉✨🏆✨🎉</div>
          </div>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {stocks.map((stock) => {
            const char = getCharacter(selectedChars[stock.symbol]);
            const startPrice = stock.history[0];
            const endPrice = stock.history[stock.history.length - 1];
            const priceChange = ((endPrice - startPrice) / startPrice * 100).toFixed(2);
            const isSelected = selectedStock === stock.symbol;
            
            return (
              <div 
                key={stock.symbol}
                ref={el => cardRefs.current[stock.symbol] = el}
                onClick={() => setSelectedStock(stock.symbol)}
                onTouchStart={(e) => handleStockCardTouch(e, stock.symbol, cardRefs.current[stock.symbol])}
                onTouchMove={(e) => handleStockCardTouch(e, stock.symbol, cardRefs.current[stock.symbol])}
                onTouchEnd={handleCanvasTouchEnd}
                className={`bg-white/10 backdrop-blur-md rounded-2xl p-5 border-2 transition-all cursor-pointer relative ${
                  isSelected ? 'border-green-400 shadow-xl shadow-green-400/20' : 'border-white/20 hover:border-white/40'
                }`}
                style={{ touchAction: 'none' }}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeStock(stock.symbol);
                  }}
                  className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors z-10"
                >
                  <X size={20} />
                </button>
                
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <h3 className="text-3xl font-bold text-white">{stock.symbol}</h3>
                      {isSelected && <span className="text-green-400 text-sm font-bold">● ACTIVE</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{char?.emoji}</span>
                      <div className="text-right">
                        <div className="text-xs text-blue-300">{char?.name}</div>
                        <div className={`text-sm font-bold ${parseFloat(priceChange) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {parseFloat(priceChange) >= 0 ? '+' : ''}{priceChange}%
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <canvas
                  ref={el => canvasRefs.current[stock.symbol] = el}
                  width={600}
                  height={200}
                  className="w-full h-48 mb-3 rounded-lg cursor-pointer pointer-events-none"
                  style={{ touchAction: 'none' }}
                />
                
                <div className="border-t border-white/20 pt-3">
                  <div className="text-blue-200 text-xs mb-2">Select Surfer:</div>
                  <div className="flex gap-2 flex-wrap">
                    {characters.map(char => {
                      const isUnlocked = unlockedChars.includes(char.id);
                      const isCharSelected = selectedChars[stock.symbol] === char.id;
                      
                      return (
                        <button
                          key={char.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            selectCharacter(stock.symbol, char.id);
                          }}
                          disabled={!isUnlocked}
                          className={`
                            relative w-12 h-12 rounded-lg flex items-center justify-center text-2xl
                            transition-all duration-200 border-2
                            ${isCharSelected ? 'border-blue-400 scale-110 shadow-lg' : 'border-white/20'}
                            ${isUnlocked ? 'hover:scale-105 cursor-pointer bg-white/10' : 'opacity-40 cursor-not-allowed bg-white/5'}
                          `}
                          title={isUnlocked ? char.name : char.unlock}
                        >
                          {char.emoji}
                          {!isUnlocked && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/70 rounded-lg text-xs">
                              🔒
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {!showAddForm ? (
          <button
            onClick={() => setShowAddForm(true)}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 rounded-2xl transition-colors flex items-center justify-center gap-2 mb-6"
          >
            <Plus size={24} />
            Add New Wave
          </button>
        ) : (
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 mb-6">
            <h3 className="text-2xl font-bold text-white mb-4">Catch a New Wave</h3>
            <div className="grid grid-cols-1 gap-4 mb-4">
              <input
                type="text"
                placeholder="Symbol (e.g., NVDA)"
                value={newStock.symbol}
                onChange={(e) => setNewStock({ ...newStock, symbol: e.target.value.toUpperCase() })}
                className="bg-white/5 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-blue-300"
              />
            </div>
            <div className="mb-4">
              <label className="text-blue-200 text-sm mb-2 block">Wave Color</label>
              <div className="flex gap-2">
                {colors.map(color => (
                  <button
                    key={color}
                    onClick={() => setNewStock({ ...newStock, color })}
                    className={`w-10 h-10 rounded-full border-2 ${newStock.color === color ? 'border-white' : 'border-white/20'}`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
            <div className="flex gap-4">
              <button
                onClick={handleAddStock}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-lg transition-colors"
              >
                Add Stock
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
        
        <div className="text-center text-blue-200 text-sm mb-6">
          💡 Unlocked: {unlockedChars.length}/{characters.length} characters • Build streaks to unlock more!
        </div>

        <div className="flex justify-center gap-4 mb-6">
          <a
            href="https://www.paypal.com/donate/?hosted_button_id=T2NMB7HJ6M8EU"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-full transition-colors shadow-lg"
          >
            Donate
          </a>
          <a
            href="mailto:surf.fm.official@gmail.com"
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-full transition-colors shadow-lg"
          >
            Contact
          </a>
        </div>
      </div>
      
      {/* Mobile Jump Button */}
      {isMobile && (
        <div className="fixed bottom-6 right-6 z-50">
          <button
            onTouchStart={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleJump();
            }}
            onClick={handleJump}
            className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full border-4 border-white/30 shadow-2xl flex items-center justify-center text-4xl active:scale-95 transition-transform"
            style={{ touchAction: 'none' }}
          >
            ⬆️
          </button>
        </div>
      )}
    </div>
  );
};

export default WaveStockSurfer;