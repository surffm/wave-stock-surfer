import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Sparkles, Zap, TrendingUp, Info, Plus, X, RefreshCw, AlertCircle } from 'lucide-react';

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
  const [realTimeData, setRealTimeData] = useState({});
  const [dataRefreshKey, setDataRefreshKey] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [apiErrors, setApiErrors] = useState({});
  const [showDataControls, setShowDataControls] = useState(false);
  const lastFetchTime = useRef({});
  
  const characters = useMemo(() => [
    { id: 'goku', name: 'Wave Warrior', emoji: '🏄‍♂️', unlocked: true, color: '#FF6B35', invertDirection: false },
    { id: 'vegeta', name: 'Storm Rider', emoji: '🥷', unlocked: true, color: '#4ECDC4', invertDirection: true },
    { id: 'gohan', name: 'Tide Master', emoji: '🐬', unlocked: false, unlock: 'Reach 5 streak', color: '#FFE66D', invertDirection: false },
    { id: 'piccolo', name: 'Foam Ninja', emoji: '🐱', unlocked: false, unlock: 'Score 1000+', color: '#95E1D3', invertDirection: true },
    { id: 'trunks', name: 'Crest Legend', emoji: '⚡', unlocked: false, unlock: 'Get 3 power-ups', color: '#F38181', invertDirection: true },
    { id: 'krillin', name: 'Beach Boss', emoji: '🌟', unlocked: false, unlock: 'Reach 10 streak', color: '#AA96DA', invertDirection: false },
    { id: 'dolphin', name: 'Wave Dolphin', emoji: '🦸‍♂️', unlocked: false, unlock: 'Reach 20 streak', color: '#3BA3FF', invertDirection: false },
    { id: 'cat', name: 'Surf Cat', emoji: '🦄', unlocked: false, unlock: 'Score 5000+', color: '#F6A5C0', invertDirection: false },
    { id: 'unicorn', name: 'Magic Unicorn', emoji: '🐺', unlocked: false, unlock: 'Collect 10 power-ups', color: '#D98FFF', invertDirection: false },
    { id: 'wolf', name: 'Lone Wolf Rider', emoji: '🧙‍♂️', unlocked: false, unlock: 'Reach 15 streak', color: '#6E8B8E', invertDirection: false }
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
    { symbol: 'GME', color: '#EC4899', history: [], selectedChar: 'goku', useRealData: true },
    { symbol: 'AAPL', color: '#60A5FA', history: [], selectedChar: 'vegeta', useRealData: true },
    { symbol: 'GOOGL', color: '#34D399', history: [], selectedChar: 'goku', useRealData: true },
    { symbol: 'TSLA', color: '#F87171', history: [], selectedChar: 'vegeta', useRealData: true }
  ], []);
  
  const [stocks, setStocks] = useState(initialStocks);
  const [selectedStock, setSelectedStock] = useState('GME');
  const [selectedChars, setSelectedChars] = useState({ GME: 'goku', AAPL: 'vegeta', GOOGL: 'goku', TSLA: 'vegeta' });
  const [surferPositions, setSurferPositions] = useState(
    initialStocks.reduce((acc, stock) => ({ 
      ...acc, 
      [stock.symbol]: { x: 0.3, y: 0.5, jumping: false, hasRocket: false, direction: 1 } 
    }), {})
  );
  const [rockets, setRockets] = useState(initialStocks.reduce((acc, stock) => ({ ...acc, [stock.symbol]: [] }), {}));
  const [waterTrails, setWaterTrails] = useState(initialStocks.reduce((acc, stock) => ({ ...acc, [stock.symbol]: [] }), {}));
  const [cutbackSplashes, setCutbackSplashes] = useState(initialStocks.reduce((acc, stock) => ({ ...acc, [stock.symbol]: [] }), {}));
  const [targetPositions, setTargetPositions] = useState(initialStocks.reduce((acc, stock) => ({ ...acc, [stock.symbol]: null }), {}));
  
  const canvasRefs = useRef({});
  const cardRefs = useRef({});
  const timeRef = useRef(0);
  const keysPressed = useRef({});
  const previousX = useRef({});
  const touchingRef = useRef(false);
  const currentTouchStock = useRef(null);
  
  useEffect(() => {
    const checkMobile = () => setIsMobile('ontouchstart' in window || navigator.maxTouchPoints > 0);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  const fetchAllStockData = useCallback(async (forceRefresh = false) => {
    setIsRefreshing(true);
    const FINNHUB_API_KEY = 'd49emh9r01qshn3lui9gd49emh9r01qshn3luia0';
    const ALPHA_VANTAGE_KEY = 'UAL2SCJ3884W7O2E';
    
    const newRealTimeData = {};
    const newApiErrors = {};
    
    for (const stock of stocks) {
      if (!stock.useRealData) continue;
      
      const lastFetch = lastFetchTime.current[stock.symbol];
      if (!forceRefresh && lastFetch && (Date.now() - lastFetch < 30000)) {
        if (realTimeData[stock.symbol]) {
          newRealTimeData[stock.symbol] = realTimeData[stock.symbol];
          continue;
        }
      }
      
      try {
        console.log(`Fetching ${stock.symbol} from Finnhub...`);
        const finnhubResponse = await fetch(
          `https://finnhub.io/api/v1/quote?symbol=${stock.symbol}&token=${FINNHUB_API_KEY}`
        );
        
        if (finnhubResponse.ok) {
          const data = await finnhubResponse.json();
          console.log(`${stock.symbol} Finnhub data:`, data);
          
          if (data.c && data.c > 0) {
            newRealTimeData[stock.symbol] = {
              currentPrice: data.c,
              open: data.o,
              high: data.h,
              low: data.l,
              previousClose: data.pc,
              changePercent: ((data.c - data.pc) / data.pc * 100).toFixed(2),
              source: 'Finnhub',
              timestamp: new Date(),
              isLive: true
            };
            lastFetchTime.current[stock.symbol] = Date.now();
            delete newApiErrors[stock.symbol];
            console.log(`${stock.symbol} successfully fetched from Finnhub`);
            continue;
          }
        }
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
        console.log(`Trying Alpha Vantage for ${stock.symbol}...`);
        const alphaResponse = await fetch(
          `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${stock.symbol}&apikey=${ALPHA_VANTAGE_KEY}`
        );
        
        if (alphaResponse.ok) {
          const alphaData = await alphaResponse.json();
          console.log(`${stock.symbol} Alpha Vantage data:`, alphaData);
          const quote = alphaData['Global Quote'];
          
          if (quote && quote['05. price']) {
            newRealTimeData[stock.symbol] = {
              currentPrice: parseFloat(quote['05. price']),
              open: parseFloat(quote['02. open']),
              high: parseFloat(quote['03. high']),
              low: parseFloat(quote['04. low']),
              previousClose: parseFloat(quote['08. previous close']),
              changePercent: parseFloat(quote['10. change percent'].replace('%', '')),
              source: 'Alpha Vantage',
              timestamp: new Date(),
              isLive: true
            };
            lastFetchTime.current[stock.symbol] = Date.now();
            delete newApiErrors[stock.symbol];
            console.log(`${stock.symbol} successfully fetched from Alpha Vantage`);
            continue;
          }
        }
        
        throw new Error('No valid data from APIs');
        
      } catch (error) {
        console.error(`Error fetching ${stock.symbol}:`, error);
        newApiErrors[stock.symbol] = error.message;
        
        const basePrice = Math.random() * 200 + 50;
        newRealTimeData[stock.symbol] = {
          currentPrice: basePrice,
          open: basePrice * 0.98,
          high: basePrice * 1.05,
          low: basePrice * 0.95,
          previousClose: basePrice * 0.99,
          changePercent: (Math.random() * 10 - 5).toFixed(2),
          source: 'Generated (API Error)',
          timestamp: new Date(),
          isLive: false
        };
      }
    }
    
    console.log('Final real-time data:', newRealTimeData);
    setRealTimeData(newRealTimeData);
    setApiErrors(newApiErrors);
    setIsRefreshing(false);
  }, [stocks, realTimeData]);
  
  useEffect(() => {
    fetchAllStockData();
    
    const interval = setInterval(() => {
      fetchAllStockData();
      setDataRefreshKey(prev => prev + 1);
    }, 60000);
    
    return () => clearInterval(interval);
  }, [fetchAllStockData]);
  
  useEffect(() => {
    console.log('Updating stock histories with real-time data...');
    setStocks(prevStocks => {
      return prevStocks.map(stock => {
        const rtData = realTimeData[stock.symbol];
        if (!rtData || !stock.useRealData) {
          if (stock.history.length === 0) {
            return {
              ...stock,
              history: generatePriceHistory(
                stock.symbol === 'GME' ? 25 : 170,
                0.03,
                50
              )
            };
          }
          return stock;
        }
        
        const { currentPrice, open, high, low } = rtData;
        const points = 50;
        const history = [];
        
        history.push(open);
        
        for (let i = 1; i < points - 1; i++) {
          const progress = i / (points - 1);
          const targetPrice = open + (currentPrice - open) * progress;
          const volatility = (high - low) * 0.1;
          const randomWalk = (Math.random() - 0.5) * volatility;
          const price = Math.max(low * 0.98, Math.min(high * 1.02, targetPrice + randomWalk));
          history.push(price);
        }
        
        history.push(currentPrice);
        
        console.log(`${stock.symbol} history generated:`, { open, currentPrice, historyLength: history.length });
        
        return {
          ...stock,
          history,
          realTimeInfo: rtData
        };
      });
    });
  }, [realTimeData, dataRefreshKey, generatePriceHistory]);
  
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
    if (!stock || stock.history.length === 0) return;
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
    setCutbackSplashes(prev => ({ ...prev, [stockSymbol]: [...(prev[stockSymbol] || []), ...particles] }));
  }, [stocks]);
  
  useEffect(() => {
    const moveInterval = setInterval(() => {
      if (!selectedStock) return;
      setSurferPositions(prev => {
        const current = prev[selectedStock];
        if (!current) return prev;
        let newX = current.x;
        let newY = current.y;
        let newDirection = current.direction;
        if (previousX.current[selectedStock] === undefined) previousX.current[selectedStock] = current.x;
        const stock = stocks.find(s => s.symbol === selectedStock);
        if (stock && stock.history.length > 0 && !current.jumping) {
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
            if (!current.jumping && stock && stock.history.length > 0) {
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
        if (!canvas || !surferPos || stock.history.length === 0) return;
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
          setWaterTrails(prev => ({ ...prev, [stock.symbol]: [...(prev[stock.symbol] || []), {
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
    if (!canvas || stock.history.length === 0) return;
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
    if (!surferPos) return;
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
        selectedChar: 'goku',
        useRealData: true
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
      
      setTimeout(() => fetchAllStockData(true), 100);
    }
  }, [newStock, colors, stocks.length, generatePriceHistory, fetchAllStockData]);

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
    setRealTimeData(prev => {
      const newData = { ...prev };
      delete newData[symbol];
      return newData;
    });
    setApiErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[symbol];
      return newErrors;
    });
    if (selectedStock === symbol) {
      setSelectedStock(stocks[0]?.symbol || null);
    }
  }, [selectedStock, stocks]);
  
  const toggleStockDataMode = useCallback((symbol) => {
    setStocks(prev => prev.map(stock => 
      stock.symbol === symbol 
        ? { ...stock, useRealData: !stock.useRealData }
        : stock
    ));
    setTimeout(() => {
      setDataRefreshKey(prev => prev + 1);
    }, 100);
  }, []);

    return (
    <div className="wave-stock-surfer" style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* Stock canvases */}
      {stocks.map(stock => (
        <canvas
          key={stock.symbol}
          ref={el => (canvasRefs.current[stock.symbol] = el)}
          width={window.innerWidth}
          height={200}
          style={{ display: 'block', margin: '20px auto', border: '1px solid #ccc', borderRadius: '12px' }}
          onMouseDown={e => handleStockCardTouch(e, stock.symbol)}
          onMouseMove={e => touchingRef.current && handleStockCardTouch(e, stock.symbol)}
          onMouseUp={handleCanvasTouchEnd}
          onTouchStart={e => handleStockCardTouch(e, stock.symbol)}
          onTouchMove={e => handleStockCardTouch(e, stock.symbol)}
          onTouchEnd={handleCanvasTouchEnd}
        />
      ))}

      {/* Stock selection */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '10px' }}>
        {stocks.map(stock => (
          <button
            key={stock.symbol}
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              border: selectedStock === stock.symbol ? '2px solid #34D399' : '1px solid #ccc',
              background: '#f0f0f0',
              cursor: 'pointer'
            }}
            onClick={() => setSelectedStock(stock.symbol)}
          >
            {stock.symbol}
          </button>
        ))}
      </div>

      {/* Add new stock */}
      {showAddForm ? (
        <div style={{ marginTop: '10px', textAlign: 'center' }}>
          <input
            type="text"
            placeholder="Symbol"
            value={newStock.symbol}
            onChange={e => setNewStock(prev => ({ ...prev, symbol: e.target.value }))}
            style={{ padding: '4px', marginRight: '4px', width: '80px' }}
          />
          <input
            type="color"
            value={newStock.color}
            onChange={e => setNewStock(prev => ({ ...prev, color: e.target.value }))}
            style={{ padding: '2px', marginRight: '4px' }}
          />
          <button onClick={handleAddStock} style={{ padding: '4px 8px', borderRadius: '6px', cursor: 'pointer' }}>
            Add
          </button>
        </div>
      ) : (
        <div style={{ textAlign: 'center', marginTop: '10px' }}>
          <button
            onClick={() => setShowAddForm(true)}
            style={{ padding: '6px 12px', borderRadius: '8px', cursor: 'pointer' }}
          >
            + Add Stock
          </button>
        </div>
      )}

      {/* Display API errors */}
      {Object.keys(apiErrors).length > 0 && (
        <div style={{ color: 'red', textAlign: 'center', marginTop: '10px' }}>
          {Object.entries(apiErrors).map(([symbol, msg]) => (
            <div key={symbol}>
              {symbol}: {msg}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default WaveStockSurfer;
