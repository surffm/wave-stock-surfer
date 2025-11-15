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
    { id: 'goku', name: 'Wave Warrior', emoji: '🏄‍♂️', unlocked: true, color: '#FF6B35' },
    { id: 'vegeta', name: 'Storm Rider', emoji: '🥷', unlocked: true, color: '#4ECDC4' },
    { id: 'gohan', name: 'Tide Master', emoji: '🧙‍♂️', unlocked: false, unlock: 'Reach 5 streak', color: '#FFE66D' },
    { id: 'piccolo', name: 'Foam Ninja', emoji: '🦸‍♂️', unlocked: false, unlock: 'Score 1000+', color: '#95E1D3' },
    { id: 'trunks', name: 'Crest Legend', emoji: '⚡', unlocked: false, unlock: 'Get 3 power-ups', color: '#F38181' },
    { id: 'krillin', name: 'Beach Boss', emoji: '🌟', unlocked: false, unlock: 'Reach 10 streak', color: '#AA96DA' }
  ], []);
  
  const colors = useMemo(() => ['#60A5FA', '#34D399', '#F87171', '#FBBF24', '#A78BFA', '#EC4899', '#14B8A6'], []);
  
  const [unlockedChars, setUnlockedChars] = useState(['goku', 'vegeta']);
  const [powerUpCount, setPowerUpCount] = useState(0);
  
  const generatePriceHistory = useCallback((basePrice, volatility, points) => {
    const history = [basePrice];
    for (let i = 1; i < points; i++) {
      const change = (Math.random() - 0.48) * volatility;
      const newPrice = history[i - 1] * (1 + change);
      history.push(newPrice);
    }
    return history;
  }, []);
  
  const initialStocks = useMemo(() => [
    { 
      symbol: 'GME', 
      color: '#EC4899', 
      history: generatePriceHistory(25, 0.045, 50),
      selectedChar: 'goku'
    },
    { 
      symbol: 'AAPL', 
      color: '#60A5FA', 
      history: generatePriceHistory(170, 0.02, 50),
      selectedChar: 'vegeta'
    },
    { 
      symbol: 'GOOGL', 
      color: '#34D399', 
      history: generatePriceHistory(140, 0.025, 50),
      selectedChar: 'goku'
    },
    { 
      symbol: 'TSLA', 
      color: '#F87171', 
      history: generatePriceHistory(250, 0.04, 50),
      selectedChar: 'vegeta'
    }
  ], [generatePriceHistory]);
  
  const [stocks, setStocks] = useState(initialStocks);
  const [selectedStock, setSelectedStock] = useState('GME');
  const [selectedChars, setSelectedChars] = useState({
    GME: 'goku',
    AAPL: 'vegeta',
    GOOGL: 'goku',
    TSLA: 'vegeta'
  });
  
  const [surferPositions, setSurferPositions] = useState(
    stocks.reduce((acc, stock) => ({
      ...acc,
      [stock.symbol]: { x: 0.3, y: 0.5, jumping: false, hasRocket: false, direction: 1 }
    }), {})
  );
  
  const [rockets, setRockets] = useState(
    stocks.reduce((acc, stock) => ({
      ...acc,
      [stock.symbol]: []
    }), {})
  );
  
  const [waterTrails, setWaterTrails] = useState(
    stocks.reduce((acc, stock) => ({
      ...acc,
      [stock.symbol]: []
    }), {})
  );
  
  const canvasRefs = useRef({});
  const cardRefs = useRef({});
  const timeRef = useRef(0);
  const keysPressed = useRef({});
  const previousX = useRef({});
  
  // Detect mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile('ontouchstart' in window || navigator.maxTouchPoints > 0);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Target position for smooth movement
  const [targetPositions, setTargetPositions] = useState(
    stocks.reduce((acc, stock) => ({
      ...acc,
      [stock.symbol]: null
    }), {})
  );
  
  // Track if user is holding touch
  const touchingRef = useRef(false);
  const currentTouchStock = useRef(null);
  
  // Handle canvas touch/click for mobile
  const handleCanvasTouch = useCallback((e, stockSymbol) => {
    if (stockSymbol !== selectedStock) return;
    
    e.preventDefault();
    const canvas = canvasRefs.current[stockSymbol];
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    const normalizedX = Math.max(0.05, Math.min(0.95, x / rect.width));
    const normalizedY = Math.max(0.3, Math.min(1.0, y / rect.height));
    
    setTargetPositions(prev => ({
      ...prev,
      [stockSymbol]: { x: normalizedX, y: normalizedY }
    }));
    
    touchingRef.current = true;
    currentTouchStock.current = stockSymbol;
  }, [selectedStock]);
  
  const handleCanvasTouchEnd = useCallback(() => {
    touchingRef.current = false;
    currentTouchStock.current = null;
  }, []);

  // Handle touch anywhere in the stock card
  const handleStockCardTouch = useCallback((e, stockSymbol, cardRef) => {
    if (stockSymbol !== selectedStock) return;
    
    e.preventDefault();
    const canvas = canvasRefs.current[stockSymbol];
    const card = cardRef;
    if (!canvas || !card) return;
    
    const canvasRect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    const x = clientX - canvasRect.left;
    const y = clientY - canvasRect.top;
    
    const normalizedX = Math.max(0.05, Math.min(0.95, x / canvasRect.width));
    // Expanded Y range to allow going lower on the wave
    const normalizedY = Math.max(0.1, Math.min(1.5, y / canvasRect.height));
    
    setTargetPositions(prev => ({
      ...prev,
      [stockSymbol]: { x: normalizedX, y: normalizedY }
    }));
    
    touchingRef.current = true;
    currentTouchStock.current = stockSymbol;
  }, [selectedStock]);
  
  // Jump button handler
  const handleJump = () => {
    if (selectedStock) {
      setSurferPositions(prev => ({
        ...prev,
        [selectedStock]: { ...prev[selectedStock], jumping: true }
      }));
      
      setTimeout(() => {
        setSurferPositions(prev => ({
          ...prev,
          [selectedStock]: { ...prev[selectedStock], jumping: false }
        }));
      }, 600);
    }
  };
  
  useEffect(() => {
    const handleKeyDown = (e) => {
      keysPressed.current[e.key] = true;
      
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }
      
      if (e.key === ' ' && selectedStock) {
        handleJump();
      }
    };
    
    const handleKeyUp = (e) => {
      keysPressed.current[e.key] = false;
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [selectedStock]);
  
  useEffect(() => {
    const moveInterval = setInterval(() => {
      if (!selectedStock) return;
      
      setSurferPositions(prev => {
        const current = prev[selectedStock];
        let newX = current.x;
        let newY = current.y;
        let newDirection = current.direction;
        
        // Get wave height at current X position to clamp surfer
        const stock = stocks.find(s => s.symbol === selectedStock);
        if (stock) {
          const history = stock.history;
          const minPrice = Math.min(...history);
          const maxPrice = Math.max(...history);
          const priceRange = maxPrice - minPrice || 1;
          
          const canvas = canvasRefs.current[selectedStock];
          if (canvas) {
            const height = canvas.height;
            
            const normalizePrice = (price) => {
              const normalized = (price - minPrice) / priceRange;
              return height * 0.8 - normalized * height * 0.5;
            };
            
            const historyIndex = current.x * (history.length - 1);
            const index = Math.floor(historyIndex);
            const nextIndex = Math.min(index + 1, history.length - 1);
            const t = historyIndex - index;
            const price = history[index] * (1 - t) + history[nextIndex] * t;
            
            let waveY = normalizePrice(price);
            const waveMotion = Math.sin(current.x * Math.PI * 4 - timeRef.current * 0.06) * 8;
            waveY += waveMotion;
            
            // Convert wave Y to normalized Y (0.5 is at wave line)
            const waveNormalizedY = 0.5 + ((waveY - (height * 0.5)) / (height * 0.8));
            
            // If not jumping, clamp Y to be at or below wave
            if (!current.jumping) {
              newY = Math.max(waveNormalizedY, newY);
            }
          }
        }
        
        // Smooth movement towards target position
        const target = targetPositions[selectedStock];
        if (target) {
          const deltaX = target.x - current.x;
          const deltaY = target.y - current.y;
          const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
          
          if (distance > 0.005) {
            // Increased speed for smoother, more responsive movement
            const speed = 0.08;
            const prevX = newX;
            newX = current.x + (deltaX / distance) * Math.min(speed, distance);
            
            // Update direction based on movement
            if (newX > prevX) {
              newDirection = 1; // Moving right
            } else if (newX < prevX) {
              newDirection = -1; // Moving left
            }
            
            let targetY = current.y + (deltaY / distance) * Math.min(speed, distance);
            
            // Apply wave clamping to target Y as well (if not jumping)
            if (!current.jumping && stock) {
              const history = stock.history;
              const minPrice = Math.min(...history);
              const maxPrice = Math.max(...history);
              const priceRange = maxPrice - minPrice || 1;
              
              const canvas = canvasRefs.current[selectedStock];
              if (canvas) {
                const height = canvas.height;
                
                const normalizePrice = (price) => {
                  const normalized = (price - minPrice) / priceRange;
                  return height * 0.8 - normalized * height * 0.5;
                };
                
                const historyIndex = newX * (history.length - 1);
                const index = Math.floor(historyIndex);
                const nextIndex = Math.min(index + 1, history.length - 1);
                const t = historyIndex - index;
                const price = history[index] * (1 - t) + history[nextIndex] * t;
                
                let waveY = normalizePrice(price);
                const waveMotion = Math.sin(newX * Math.PI * 4 - timeRef.current * 0.06) * 8;
                waveY += waveMotion;
                
                const waveNormalizedY = 0.5 + ((waveY - (height * 0.5)) / (height * 0.8));
                targetY = Math.max(waveNormalizedY, targetY);
              }
            }
            
            newY = targetY;
          } else {
            // Close enough to target, clear it only if not actively touching
            if (!touchingRef.current || currentTouchStock.current !== selectedStock) {
              setTargetPositions(prev => ({ ...prev, [selectedStock]: null }));
            }
          }
        }
        
        // Keyboard controls (override target movement)
        if (keysPressed.current['ArrowLeft']) {
          newX = Math.max(0.05, newX - 0.02);
          newDirection = -1;
          setTargetPositions(prev => ({ ...prev, [selectedStock]: null }));
        }
        if (keysPressed.current['ArrowRight']) {
          newX = Math.min(0.95, newX + 0.02);
          newDirection = 1;
          setTargetPositions(prev => ({ ...prev, [selectedStock]: null }));
        }
        if (keysPressed.current['ArrowUp']) {
          if (current.hasRocket) {
            newY = Math.max(-0.2, newY - 0.02);
          } else {
            newY = Math.max(0.5, newY - 0.02);
          }
          setTargetPositions(prev => ({ ...prev, [selectedStock]: null }));
        }
        if (keysPressed.current['ArrowDown']) {
          newY = Math.min(1.5, newY + 0.02);
          setTargetPositions(prev => ({ ...prev, [selectedStock]: null }));
        }
        
        return {
          ...prev,
          [selectedStock]: { ...current, x: newX, y: newY, direction: newDirection }
        };
      });
    }, 16);
    
    return () => clearInterval(moveInterval);
  }, [selectedStock, targetPositions, stocks]);
  
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
        
        const normalizePrice = (price) => {
          const normalized = (price - minPrice) / priceRange;
          return height * 0.8 - normalized * height * 0.5;
        };
        
        const historyIndex = surferPos.x * (history.length - 1);
        const index = Math.floor(historyIndex);
        const nextIndex = Math.min(index + 1, history.length - 1);
        const t = historyIndex - index;
        const price = history[index] * (1 - t) + history[nextIndex] * t;
        
        let baseY = normalizePrice(price);
        const waveMotion = Math.sin(surferPos.x * Math.PI * 4 - timeRef.current * 0.06) * 8;
        baseY += waveMotion;
        const verticalOffset = (surferPos.y - 0.5) * height * 0.8;
        const jumpOffset = surferPos.jumping ? -30 : 0;
        
        const surferX = surferPos.x * width;
        const surferY = baseY - 15 + jumpOffset + verticalOffset;
        
        for (let i = 0; i < 2; i++) {
          const spreadAngle = (Math.random() - 0.5) * Math.PI / 3;
          const speed = Math.random() * 3 + 2;
          
          setWaterTrails(prev => ({
            ...prev,
            [stock.symbol]: [
              ...prev[stock.symbol],
              {
                id: Date.now() + Math.random(),
                x: surferX,
                y: surferY,
                vx: Math.cos(Math.PI + spreadAngle) * speed,
                vy: Math.sin(Math.PI + spreadAngle) * speed - 2,
                life: 1,
                size: Math.random() * 3 + 2
              }
            ].slice(-30)
          }));
        }
      });
    }, 50);
    
    return () => clearInterval(trailInterval);
  }, [stocks, surferPositions]);
  
  useEffect(() => {
    const newUnlocked = [...unlockedChars];
    
    if (streak >= 5 && !newUnlocked.includes('gohan')) {
      newUnlocked.push('gohan');
      setCelebration(true);
      setTimeout(() => setCelebration(false), 2000);
    }
    if (score >= 1000 && !newUnlocked.includes('piccolo')) {
      newUnlocked.push('piccolo');
      setCelebration(true);
      setTimeout(() => setCelebration(false), 2000);
    }
    if (powerUpCount >= 3 && !newUnlocked.includes('trunks')) {
      newUnlocked.push('trunks');
      setCelebration(true);
      setTimeout(() => setCelebration(false), 2000);
    }
    if (streak >= 10 && !newUnlocked.includes('krillin')) {
      newUnlocked.push('krillin');
      setCelebration(true);
      setTimeout(() => setCelebration(false), 2000);
    }
    
    setUnlockedChars(newUnlocked);
  }, [streak, score, powerUpCount, unlockedChars]);
  
  useEffect(() => {
    const interval = setInterval(() => {
      const points = Math.floor(Math.random() * 50) + 20;
      setScore(s => s + points * multiplier);
      
      if (Math.random() > 0.3) {
        setStreak(s => {
          const newStreak = s + 1;
          if (newStreak % 5 === 0) {
            setMultiplier(m => Math.min(m + 0.5, 5));
            setCelebration(true);
            setTimeout(() => setCelebration(false), 1500);
          }
          return newStreak;
        });
      } else {
        setStreak(0);
        setMultiplier(1);
      }
      
      if (Math.random() > 0.85) {
        const powerUps = ['speed', 'glow', 'foam', 'multiplier'];
        const selected = powerUps[Math.floor(Math.random() * powerUps.length)];
        setPowerUp(selected);
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
    
    const normalizePrice = (price) => {
      const normalized = (price - minPrice) / priceRange;
      return height * 0.8 - normalized * height * 0.5;
    };
    
    const speed = 0.02;
    const offset = time * speed;
    
    const points = [];
    const segments = 60;
    for (let i = 0; i < segments; i++) {
      const x = (i / segments) * width;
      const progress = i / segments;
      
      const historyIndex = progress * (history.length - 1);
      const index = Math.floor(historyIndex);
      const nextIndex = Math.min(index + 1, history.length - 1);
      const t = historyIndex - index;
      const price = history[index] * (1 - t) + history[nextIndex] * t;
      
      let y = normalizePrice(price);
      const waveMotion = Math.sin(progress * Math.PI * 4 - offset * 3) * 8;
      y += waveMotion;
      const foamNoise = Math.sin(x * 0.3 + time * 0.5) * 2;
      y += foamNoise;
      
      points.push({ x, y });
    }
    
    let crestIndex = 0;
    let highestY = height;
    points.forEach((point, i) => {
      if (point.y < highestY) {
        highestY = point.y;
        crestIndex = i;
      }
    });
    
    for (let layer = 0; layer < 3; layer++) {
      ctx.beginPath();
      points.forEach((point, i) => {
        const layerOffset = layer * 5;
        if (i === 0) {
          ctx.moveTo(point.x, point.y + layerOffset);
        } else {
          ctx.lineTo(point.x, point.y + layerOffset);
        }
      });
      
      ctx.lineTo(width, height);
      ctx.lineTo(0, height);
      ctx.closePath();
      
      const opacity = 0.25 - layer * 0.05;
      ctx.fillStyle = stock.color + Math.floor(opacity * 255).toString(16).padStart(2, '0');
      ctx.fill();
      
      ctx.beginPath();
      points.forEach((point, i) => {
        const layerOffset = layer * 5;
        if (i === 0) {
          ctx.moveTo(point.x, point.y + layerOffset);
        } else {
          ctx.lineTo(point.x, point.y + layerOffset);
        }
      });
      ctx.strokeStyle = stock.color + Math.floor((opacity + 0.3) * 255).toString(16).padStart(2, '0');
      ctx.lineWidth = 3;
      ctx.stroke();
    }
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    for (let i = Math.max(0, crestIndex - 3); i < Math.min(points.length, crestIndex + 6); i++) {
      for (let j = 0; j < 3; j++) {
        const foamX = points[i].x + (Math.random() - 0.5) * 15;
        const foamY = points[i].y - Math.random() * 15;
        ctx.beginPath();
        ctx.arc(foamX, foamY, Math.random() * 2 + 1, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    
    const surferPos = surferPositions[stock.symbol];
    const surferIndex = Math.floor(surferPos.x * (points.length - 1));
    const surferPoint = points[surferIndex];
    const prevPoint = points[Math.max(0, surferIndex - 1)];
    const angle = Math.atan2(surferPoint.y - prevPoint.y, surferPoint.x - prevPoint.x);
    
    const verticalOffset = (surferPos.y - 0.5) * height * 0.8;
    
    const char = characters.find(c => c.id === selectedChars[stock.symbol]);
    
    ctx.save();
    const jumpOffset = surferPos.jumping ? -30 : 0;
    ctx.translate(surferPoint.x, surferPoint.y - 15 + jumpOffset + verticalOffset);
    ctx.rotate(angle);
    
    // Flip horizontally based on direction
    if (surferPos.direction === -1) {
      ctx.scale(-1, 1);
    }
    
    if (stock.symbol === selectedStock) {
      ctx.shadowBlur = 25;
      ctx.shadowColor = '#00FF00';
    }
    
    ctx.font = '32px Arial';
    ctx.fillText(char?.emoji || '🏄‍♂️', -16, 8);
    
    ctx.restore();
    
    const trails = waterTrails[stock.symbol] || [];
    trails.forEach(particle => {
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
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = 'bold 12px Arial';
    const startPrice = history[0];
    const endPrice = history[history.length - 1];
    const priceChange = ((endPrice - startPrice) / startPrice * 100).toFixed(2);
    
    ctx.fillText(`Start: $${startPrice.toFixed(2)}`, 10, 20);
    ctx.fillText(`Now: $${endPrice.toFixed(2)}`, width - 120, 20);
    
    const changeColor = priceChange >= 0 ? '#34D399' : '#F87171';
    ctx.fillStyle = changeColor;
    ctx.fillText(`${priceChange}%`, width / 2 - 20, 20);
  }, [surferPositions, selectedChars, characters, selectedStock, waterTrails]);
  
  useEffect(() => {
    let animationFrame;
    
    const animate = () => {
      timeRef.current += 0.1;
      
      setWaterTrails(prev => {
        const updated = {};
        Object.keys(prev).forEach(symbol => {
          updated[symbol] = prev[symbol]
            .map(particle => ({
              ...particle,
              x: particle.x + particle.vx,
              y: particle.y + particle.vy,
              vy: particle.vy + 0.2,
              life: particle.life - 0.02
            }))
            .filter(p => p.life > 0);
        });
        return updated;
      });
      
      stocks.forEach((stock) => {
        const canvas = canvasRefs.current[stock.symbol];
        drawWave(canvas, stock, timeRef.current);
      });
      animationFrame = requestAnimationFrame(animate);
    };
    
    animate();
    return () => cancelAnimationFrame(animationFrame);
  }, [stocks, drawWave]);
  
  const selectCharacter = useCallback((stockSymbol, charId) => {
    if (unlockedChars.includes(charId)) {
      setSelectedChars(prev => ({ ...prev, [stockSymbol]: charId }));
    }
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