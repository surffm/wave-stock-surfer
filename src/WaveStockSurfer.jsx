import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Sparkles, Zap, TrendingUp, Info, Plus, X } from 'lucide-react';

const WaveStockSurfer = () => {
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [multiplier, setMultiplier] = useState(1);
  const [showMenu, setShowMenu] = useState(false);
  const [activeMenuTab, setActiveMenuTab] = useState('mywaves');
  const [powerUp, setPowerUp] = useState(null);
  const [celebration, setCelebration] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newStock, setNewStock] = useState({ symbol: '', color: '#60A5FA' });
  const [isMobile, setIsMobile] = useState(false);
  const [realPrices, setRealPrices] = useState({});
  const [priceChanges, setPriceChanges] = useState({});
  const [fetchingPrices, setFetchingPrices] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
const [playerName, setPlayerName] = useState('');
const [leaderboard, setLeaderboard] = useState([
  { name: 'WaveMaster', score: 15420, streak: 28 },
  { name: 'SurfKing', score: 12850, streak: 22 },
  { name: 'OceanRider', score: 11200, streak: 19 },
  { name: 'TideBreaker', score: 9750, streak: 17 },
  { name: 'CoastalPro', score: 8900, streak: 15 },
  { name: 'BeachBoss', score: 7600, streak: 13 },
  { name: 'WaveWarrior', score: 6500, streak: 11 },
  { name: 'SurfNinja', score: 5200, streak: 9 },
  { name: 'CrestChaser', score: 4100, streak: 8 },
  { name: 'AquaAce', score: 3500, streak: 6 }
]);
  
  const audioContextRef = useRef(null);
  const oceanNoiseRef = useRef(null);
  const masterGainRef = useRef(null);
  
  const characters = useMemo(() => [
    { id: 'goku', name: 'Wave Warrior', emoji: '🏄‍♂️', unlocked: true, color: '#FF6B35', invertDirection: false },
    { id: 'vegeta', name: 'Surf Ninja', emoji: '🥷', unlocked: true, color: '#4ECDC4', invertDirection: true },
    { id: 'gohan', name: 'Wave Dolphin', emoji: '🐬', unlocked: false, unlock: 'Reach 5 streak', color: '#FFE66D', invertDirection: false },
    { id: 'piccolo', name: 'Surf Cat', emoji: '🐱', unlocked: false, unlock: 'Score 1000+', color: '#95E1D3', invertDirection: true },
    { id: 'trunks', name: 'Crest Legend', emoji: '⚡', unlocked: false, unlock: 'Get 3 power-ups', color: '#F38181', invertDirection: true },
    { id: 'krillin', name: 'Beach Boss', emoji: '🌟', unlocked: false, unlock: 'Reach 10 streak', color: '#AA96DA', invertDirection: false },
    { id: 'dolphin', name: 'Storm Rider', emoji: '🦸‍♂️', unlocked: false, unlock: 'Reach 20 streak', color: '#3BA3FF', invertDirection: false },
    { id: 'cat', name: 'Magic Unicorn', emoji: '🦄', unlocked: false, unlock: 'Score 5000+', color: '#F6A5C0', invertDirection: false },
    { id: 'unicorn', name: 'Lone Wolf Rider', emoji: '🐺', unlocked: false, unlock: 'Collect 10 power-ups', color: '#D98FFF', invertDirection: false },
    { id: 'wolf', name: 'Tide Master', emoji: '🧙‍♂️', unlocked: false, unlock: 'Reach 15 streak', color: '#6E8B8E', invertDirection: false }
  ], []);

  const trendingStocks = useMemo(() => [
    { symbol: 'NVDA', name: 'NVIDIA', color: '#76B900' },
    { symbol: 'MSFT', name: 'Microsoft', color: '#00A4EF' },
    { symbol: 'AMZN', name: 'Amazon', color: '#FF9900' },
    { symbol: 'META', name: 'Meta', color: '#0668E1' },
    { symbol: 'NFLX', name: 'Netflix', color: '#E50914' },
    { symbol: 'AMD', name: 'AMD', color: '#ED1C24' },
    { symbol: 'COIN', name: 'Coinbase', color: '#0052FF' },
    { symbol: 'PLTR', name: 'Palantir', color: '#101113' },
    { symbol: 'RIVN', name: 'Rivian', color: '#00FFB4' },
    { symbol: 'SHOP', name: 'Shopify', color: '#96BF48' },
    { symbol: 'SQ', name: 'Block', color: '#00D924' },
    { symbol: 'UBER', name: 'Uber', color: '#000000' }
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
    { symbol: 'GME', color: '#34D399', history: generatePriceHistory(25, 0.045, 50), selectedChar: 'goku' },
    { symbol: 'AAPL', color: '#60A5FA', history: generatePriceHistory(170, 0.02, 50), selectedChar: 'vegeta' },
    { symbol: 'GOOGL', color: '#EC4899', history: generatePriceHistory(140, 0.025, 50), selectedChar: 'goku' },
    { symbol: 'TSLA', color: '#F87171', history: generatePriceHistory(250, 0.04, 50), selectedChar: 'vegeta' }
  ], [generatePriceHistory]);
  
  const [stocks, setStocks] = useState(initialStocks);
  const [selectedStock, setSelectedStock] = useState('GME');
  const [selectedChars, setSelectedChars] = useState({ GME: 'goku', AAPL: 'vegeta', GOOGL: 'goku', TSLA: 'vegeta' });
  const [surferPositions, setSurferPositions] = useState(stocks.reduce((acc, stock) => ({ ...acc, [stock.symbol]: { x: 0.3, y: 0.5, jumping: false, direction: 1, spinning: false, spinCount: 0 } }), {}));
  const [waterTrails, setWaterTrails] = useState(stocks.reduce((acc, stock) => ({ ...acc, [stock.symbol]: [] }), {}));
  const [cutbackSplashes, setCutbackSplashes] = useState(stocks.reduce((acc, stock) => ({ ...acc, [stock.symbol]: [] }), {}));
  const canvasRefs = useRef({});
  const timeRef = useRef(0);
  const keysPressed = useRef({});
  const previousX = useRef({});
  const [targetPositions, setTargetPositions] = useState(stocks.reduce((acc, stock) => ({ ...acc, [stock.symbol]: null }), {}));
  const touchingRef = useRef(false);
  const currentTouchStock = useRef(null);
  
  const initAudio = useCallback(() => {
    if (audioContextRef.current) return;
    
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const audioCtx = new AudioContext();
      audioContextRef.current = audioCtx;
      
      masterGainRef.current = audioCtx.createGain();
      masterGainRef.current.gain.value = 0.3;
      masterGainRef.current.connect(audioCtx.destination);
      
      const bufferSize = audioCtx.sampleRate * 2;
      const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.15;
      }
      
      const oceanNoise = audioCtx.createBufferSource();
      oceanNoise.buffer = buffer;
      oceanNoise.loop = true;
      
      const oceanFilter = audioCtx.createBiquadFilter();
      oceanFilter.type = 'lowpass';
      oceanFilter.frequency.value = 800;
      oceanFilter.Q.value = 0.5;
      
      const oceanGain = audioCtx.createGain();
      oceanGain.gain.value = 0.2;
      
      oceanNoise.connect(oceanFilter);
      oceanFilter.connect(oceanGain);
      oceanGain.connect(masterGainRef.current);
      
      oceanNoise.start();
      oceanNoiseRef.current = oceanNoise;
    } catch (error) {
      console.error('Audio initialization failed:', error);
    }
  }, []);
  
  const playWaterSplash = useCallback(() => {
    if (!soundEnabled || !audioContextRef.current) return;

    try {
      const ctx = audioContextRef.current;
      const now = ctx.currentTime;

      const bufferSize = ctx.sampleRate * 0.1;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.2;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(900 + Math.random() * 300, now);
      filter.Q.value = 0.8;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.linearRampToValueAtTime(0.15, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(masterGainRef.current);

      noise.start(now);
      noise.stop(now + 0.2);
    } catch (error) {
      console.error("Water splash playback error:", error);
    }
  }, [soundEnabled]);
  
  const playJumpSound = useCallback(() => {
    if (!soundEnabled || !audioContextRef.current) return;

    try {
      const ctx = audioContextRef.current;
      const now = ctx.currentTime;

      const bufferSize = ctx.sampleRate * 0.12;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.18;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(1000 + Math.random() * 300, now);
      filter.Q.value = 0.8;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.linearRampToValueAtTime(0.12, now + 0.06);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(masterGainRef.current);

      noise.start(now);
      noise.stop(now + 0.22);
    } catch (error) {
      console.error("Jump sound error:", error);
    }
  }, [soundEnabled]);
  
  const playSpinSound = useCallback(() => {
    if (!soundEnabled || !audioContextRef.current) return;

    try {
      const ctx = audioContextRef.current;
      const now = ctx.currentTime;

      const bufferSize = ctx.sampleRate * 0.15;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.2;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(800 + Math.random() * 400, now);
      filter.Q.value = 1;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.03, now);
      gain.gain.linearRampToValueAtTime(0.1, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(masterGainRef.current);

      noise.start(now);
      noise.stop(now + 0.25);
    } catch (error) {
      console.error("Spin sound error:", error);
    }
  }, [soundEnabled]);
  
  const playScoreSound = useCallback(() => {
    return;
  }, []);
  
  const playStreakSound = useCallback(() => {
    return;
  }, []);
  
  const playCelebrationSound = useCallback(() => {
    if (!soundEnabled || !audioContextRef.current) return;

    try {
      const ctx = audioContextRef.current;
      const now = ctx.currentTime;

      const rand = (min, max) => Math.random() * (max - min) + min;
      const coinCount = Math.floor(rand(3, 7));
      let timeOffset = 0;

      for (let i = 0; i < coinCount; i++) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        const waveTypes = ['triangle', 'sine', 'square'];
        osc.type = waveTypes[Math.floor(rand(0, waveTypes.length))];

        const baseFreq = rand(800, 1500);
        osc.frequency.setValueAtTime(baseFreq, now + timeOffset);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * rand(1.1, 1.4), now + timeOffset + 0.05);

        gain.gain.setValueAtTime(rand(0.02, 0.05), now + timeOffset);
        gain.gain.exponentialRampToValueAtTime(0.001, now + timeOffset + 0.08);

        osc.connect(gain);
        gain.connect(masterGainRef.current);

        osc.start(now + timeOffset);
        osc.stop(now + timeOffset + 0.08);

        timeOffset += rand(0.03, 0.08);
      }
    } catch (error) {
      console.error('Sound playback error:', error);
    }
  }, [soundEnabled]);

  const playPowerUpSound = useCallback(() => {
    return;
  }, []);
  
  const toggleSound = useCallback(() => {
    if (!soundEnabled) {
      initAudio();
      setSoundEnabled(true);
    } else {
      setSoundEnabled(false);
      if (oceanNoiseRef.current) {
        try {
          oceanNoiseRef.current.stop();
        } catch (e) {}
        oceanNoiseRef.current = null;
      }
      if (audioContextRef.current) {
        try {
          audioContextRef.current.close();
        } catch (e) {}
        audioContextRef.current = null;
      }
    }
  }, [soundEnabled, initAudio]);
  
  const fetchStockPrices = useCallback(async () => {
    setFetchingPrices(true);
    const newPrices = {};
    const newChanges = {};
    
    for (const stock of stocks) {
      try {
        const finnhubResponse = await fetch(
          `https://finnhub.io/api/v1/quote?symbol=${stock.symbol}&token=d49emh9r01qshn3lui9gd49emh9r01qshn3luia0`
        );
        
        if (finnhubResponse.ok) {
          const finnhubData = await finnhubResponse.json();
          if (finnhubData.c && finnhubData.c > 0) {
            newPrices[stock.symbol] = finnhubData.c;
            newChanges[stock.symbol] = {
              amount: finnhubData.d || 0,
              percent: finnhubData.dp || 0
            };
            continue;
          }
        }
        
        await new Promise(resolve => setTimeout(resolve, 200));
        const alphaResponse = await fetch(
          `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${stock.symbol}&apikey=UAL2SCJ3884W7O2E`
        );
        
        if (alphaResponse.ok) {
          const alphaData = await alphaResponse.json();
          const quote = alphaData['Global Quote'];
          if (quote && quote['05. price']) {
            newPrices[stock.symbol] = parseFloat(quote['05. price']);
            newChanges[stock.symbol] = {
              amount: parseFloat(quote['09. change'] || 0),
              percent: parseFloat(quote['10. change percent']?.replace('%', '') || 0)
            };
          }
        }
      } catch (error) {
        console.error(`Error fetching price for ${stock.symbol}:`, error);
      }
    }
    
    setRealPrices(newPrices);
    setPriceChanges(newChanges);
    setFetchingPrices(false);
  }, [stocks]);
  
  useEffect(() => {
    fetchStockPrices();
    const interval = setInterval(fetchStockPrices, 30000);
    return () => clearInterval(interval);
  }, [fetchStockPrices]);

useEffect(() => {
    const loadLeaderboard = async () => {
      try {
        const stored = await window.storage.list('leaderboard:', true);
        if (stored && stored.keys) {
          const entries = [];
          for (const key of stored.keys) {
            const result = await window.storage.get(key, true);
            if (result && result.value) {
              entries.push(JSON.parse(result.value));
            }
          }
          entries.sort((a, b) => b.score - a.score);
          setLeaderboard(entries.slice(0, 10));
        }
      } catch (error) {
        console.log('Leaderboard not available yet');
      }
    };
    loadLeaderboard();
  }, []);
  
 const submitScore = useCallback(async () => {
  if (!playerName.trim()) {
    return;
  }
  
  try {
    const entry = {
      name: playerName.trim(),
      score: score,
      streak: streak,
      timestamp: Date.now()
    };
    
    setPlayerName(''); 
      
      await window.storage.set(`leaderboard:${Date.now()}-${Math.random()}`, JSON.stringify(entry), true);
      
      const stored = await window.storage.list('leaderboard:', true);
      if (stored && stored.keys) {
        const entries = [];
        for (const key of stored.keys) {
          const result = await window.storage.get(key, true);
          if (result && result.value) {
            entries.push(JSON.parse(result.value));
          }
        }
        entries.sort((a, b) => b.score - a.score);
        setLeaderboard(entries.slice(0, 10));
      }
    } catch (error) {
      console.error('Error submitting score:', error);
    }
  }, [playerName, score, streak]);
  
  useEffect(() => {
    const checkMobile = () => setIsMobile('ontouchstart' in window || navigator.maxTouchPoints > 0);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    const startAudio = () => {
      if (soundEnabled && !audioContextRef.current) {
        initAudio();
      }
    };
    
    window.addEventListener('click', startAudio, { once: true });
    window.addEventListener('touchstart', startAudio, { once: true });
    window.addEventListener('keydown', startAudio, { once: true });
    
    return () => {
      window.removeEventListener('resize', checkMobile);
      window.removeEventListener('click', startAudio);
      window.removeEventListener('touchstart', startAudio);
      window.removeEventListener('keydown', startAudio);
    };
  }, [initAudio, soundEnabled]);
  
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
  
  const jumpTimeoutRef = useRef(null);
  
  const handleJump = useCallback(() => {
    if (selectedStock) {
      setSurferPositions(prev => {
        const current = prev[selectedStock];
        if (current.jumping && current.spinning) {
          playSpinSound();
          return {
            ...prev,
            [selectedStock]: {
              ...current,
              spinCount: current.spinCount + 1
            }
          };
        } else if (current.jumping) {
          playSpinSound();
          return {
            ...prev,
            [selectedStock]: {
              ...current,
              spinning: true,
              spinCount: current.spinCount + 1
            }
          };
        } else {
          playJumpSound();
          setTimeout(() => {
            setSurferPositions(p => ({
              ...p,
              [selectedStock]: {
                ...p[selectedStock],
                jumping: false,
                spinning: false,
                spinCount: 0
              }
            }));
          }, 600);
          
          return {
            ...prev,
            [selectedStock]: {
              ...current,
              jumping: true,
              spinning: false,
              spinCount: 0
            }
          };
        }
      });
    }
  }, [selectedStock, playJumpSound, playSpinSound]);
  
  useEffect(() => {
    let spinInterval;
    
    const handleKeyDown = (e) => {
      if (!keysPressed.current[e.key]) {
        keysPressed.current[e.key] = true;
        if (e.key === ' ' && selectedStock) {
          handleJump();
          spinInterval = setInterval(() => {
            if (keysPressed.current[' ']) {
              handleJump();
            }
          }, 100);
        }
      }
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault();
    };
    
    const handleKeyUp = (e) => { 
      keysPressed.current[e.key] = false;
      if (e.key === ' ') {
        clearInterval(spinInterval);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      clearInterval(spinInterval);
    };
  }, [selectedStock, handleJump]);
  
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
    playWaterSplash();
  }, [stocks, playWaterSplash]);
  
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
        }
        if (keysPressed.current['ArrowRight']) {
          const oldX = newX;
          newX = Math.min(0.95, newX + 0.02);
          if (newX > oldX && newDirection === -1) createCutbackSplash(selectedStock, newX, current.y);
          if (newX > oldX) newDirection = 1;
        }
        if (keysPressed.current['ArrowUp']) { newY = Math.max(0.5, newY - 0.02); }
        if (keysPressed.current['ArrowDown']) { newY = Math.min(1.5, newY + 0.02); }
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
    if (streak >= 5 && !newUnlocked.includes('gohan')) { newUnlocked.push('gohan'); setCelebration(true); playCelebrationSound(); setTimeout(() => setCelebration(false), 2000); }
    if (score >= 1000 && !newUnlocked.includes('piccolo')) { newUnlocked.push('piccolo'); setCelebration(true); playCelebrationSound(); setTimeout(() => setCelebration(false), 2000); }
    if (powerUpCount >= 3 && !newUnlocked.includes('trunks')) { newUnlocked.push('trunks'); setCelebration(true); playCelebrationSound(); setTimeout(() => setCelebration(false), 2000); }
    if (streak >= 10 && !newUnlocked.includes('krillin')) { newUnlocked.push('krillin'); setCelebration(true); playCelebrationSound(); setTimeout(() => setCelebration(false), 2000); }
    if (streak >= 20 && !newUnlocked.includes('dolphin')) { newUnlocked.push('dolphin'); setCelebration(true); playCelebrationSound(); setTimeout(() => setCelebration(false), 2000); }
    if (score >= 5000 && !newUnlocked.includes('cat')) { newUnlocked.push('cat'); setCelebration(true); playCelebrationSound(); setTimeout(() => setCelebration(false), 2000); }
    if (powerUpCount >= 10 && !newUnlocked.includes('unicorn')) { newUnlocked.push('unicorn'); setCelebration(true); playCelebrationSound(); setTimeout(() => setCelebration(false), 2000); }
    if (streak >= 15 && !newUnlocked.includes('wolf')) { newUnlocked.push('wolf'); setCelebration(true); playCelebrationSound(); setTimeout(() => setCelebration(false), 2000); }
    setUnlockedChars(newUnlocked);
  }, [streak, score, powerUpCount, unlockedChars, playCelebrationSound]);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setScore(s => s + (Math.floor(Math.random() * 50) + 20) * multiplier);
      playScoreSound();
      if (Math.random() > 0.3) {
        setStreak(s => {
          const newStreak = s + 1;
          if (newStreak % 5 === 0) { setMultiplier(m => Math.min(m + 0.5, 5)); setCelebration(true); playStreakSound(); setTimeout(() => setCelebration(false), 1500); }
          else { playStreakSound(); }
          return newStreak;
        });
      } else { setStreak(0); setMultiplier(1); }
      if (Math.random() > 0.85) {
        setPowerUp(['speed', 'glow', 'foam', 'multiplier'][Math.floor(Math.random() * 4)]);
        setPowerUpCount(c => c + 1);
        playPowerUpSound();
        setTimeout(() => setPowerUp(null), 3000);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [multiplier, playScoreSound, playStreakSound, playPowerUpSound]);
  
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
    
    const priceChange = priceChanges[stock.symbol];
    let waveShift = 0;
    if (priceChange) {
      waveShift = Math.max(-10, Math.min(10, priceChange.percent * 1.5));
    }
    
    const normalizePrice = (price) => height * 0.8 - ((price - minPrice) / priceRange) * height * 0.5 - waveShift;
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
    
    let spinRotation = 0;
    if (surferPos.spinning && surferPos.jumping) {
      spinRotation = (time * 20) % (Math.PI * 2);
    }
    
    ctx.save();
    ctx.translate(surferPoint.x, surferPoint.y - 15 + (surferPos.jumping ? -30 : 0) + (surferPos.y - 0.5) * height * 0.8);
    ctx.rotate(angle + spinRotation);
    const shouldFlip = char?.invertDirection ? (surferPos.direction === -1) : (surferPos.direction === 1);
    if (shouldFlip && !surferPos.spinning) ctx.scale(-1, 1);
    
    if (stock.symbol === selectedStock) { 
      ctx.shadowBlur = surferPos.spinning ? 40 : 25; 
      ctx.shadowColor = surferPos.spinning ? '#FFD700' : '#00FF00';
    }
    
    const spinScale = surferPos.spinning ? 1 + Math.sin(time * 10) * 0.2 : 1;
    ctx.scale(spinScale, spinScale);
    
    ctx.font = '32px Arial';
    ctx.fillText(char?.emoji || '🏄‍♂️', -16, 8);
    ctx.restore();
    
    if (surferPos.spinning && surferPos.jumping) {
      for (let i = 0; i < 3; i++) {
        ctx.globalAlpha = 0.6;
        ctx.fillStyle = ['#FFD700', '#FF6B35', '#4ECDC4', '#F87171'][i % 4];
        ctx.shadowBlur = 20;
        ctx.shadowColor = ctx.fillStyle;
        const trailAngle = (time * 20 + i * Math.PI / 1.5) % (Math.PI * 2);
        const trailDist = 25 + Math.sin(time * 15 + i) * 10;
        const trailX = surferPoint.x + Math.cos(trailAngle) * trailDist;
        const trailY = surferPoint.y - 15 + (surferPos.jumping ? -30 : 0) + (surferPos.y - 0.5) * height * 0.8 + Math.sin(trailAngle) * trailDist;
        ctx.beginPath();
        ctx.arc(trailX, trailY, 4 + Math.sin(time * 10 + i) * 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
      }
    }
    
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
    
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
    
    const realPrice = realPrices[stock.symbol];
    const change = priceChanges[stock.symbol];
    
    if (realPrice && change) {
      const isPositive = change.percent >= 0;
      const priceColor = isPositive ? '#34D399' : '#F87171';
      
      ctx.fillStyle = 'rgba(255, 255, 255, 0.98)';
      ctx.font = 'bold 28px -apple-system, BlinkMacSystemFont, "Segoe UI", Arial';
      ctx.fillText(`${realPrice.toFixed(2)}`, 15, 35);
      
      ctx.font = 'bold 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Arial';
      ctx.fillStyle = priceColor;
      const arrow = isPositive ? '↑' : '↓';
      ctx.fillText(`${arrow} ${Math.abs(change.percent).toFixed(2)}%`, 15, 60);
      
      ctx.font = '14px -apple-system, BlinkMacSystemFont, "Segoe UI", Arial';
      ctx.fillStyle = priceColor;
      ctx.fillText(`${change.amount >= 0 ? '+' : ''}${Math.abs(change.amount).toFixed(2)}`, 15, 78);
    } else {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.font = '16px -apple-system, BlinkMacSystemFont, "Segoe UI", Arial';
      ctx.fillText('Loading...', 15, 35);
    }
  }, [surferPositions, selectedChars, characters, selectedStock, waterTrails, cutbackSplashes, realPrices, priceChanges]);
  
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
    // Check if stock already exists
    if (stocks.some(s => s.symbol === newStock.symbol.toUpperCase())) {
      return; // Don't add duplicate
    }
    
    const basePrice = Math.random() * 200 + 50;
    const newStockData = {
      symbol: newStock.symbol.toUpperCase(),
      color: newStock.color,
      history: generatePriceHistory(basePrice, 0.03, 50),
      selectedChar: 'goku'
    };
      
      setStocks(prev => [newStockData, ...prev]);
      setSelectedChars(prev => ({ ...prev, [newStock.symbol.toUpperCase()]: 'goku' }));
      setSurferPositions(prev => ({ 
        ...prev, 
        [newStock.symbol.toUpperCase()]: { x: 0.3, y: 0.5, jumping: false, direction: 1, spinning: false, spinCount: 0 }
      }));
      setWaterTrails(prev => ({ ...prev, [newStock.symbol.toUpperCase()]: [] }));
      setCutbackSplashes(prev => ({ ...prev, [newStock.symbol.toUpperCase()]: [] }));
      setTargetPositions(prev => ({ ...prev, [newStock.symbol.toUpperCase()]: null }));
      
      setNewStock({ symbol: '', color: colors[stocks.length % colors.length] });
      setShowAddForm(false);
    }
  }, [newStock, colors, stocks.length, generatePriceHistory]);

  const addTrendingStock = useCallback((trendingStock) => {
    if (stocks.some(s => s.symbol === trendingStock.symbol)) {
      return;
    }
    
    const basePrice = Math.random() * 200 + 50;
    const newStockData = {
      symbol: trendingStock.symbol,
      color: trendingStock.color,
      history: generatePriceHistory(basePrice, 0.03, 50),
      selectedChar: 'goku'
    };
    
    setStocks(prev => [newStockData, ...prev]);
    setSelectedChars(prev => ({ ...prev, [trendingStock.symbol]: 'goku' }));
    setSurferPositions(prev => ({ 
      ...prev, 
      [trendingStock.symbol]: { x: 0.3, y: 0.5, jumping: false, direction: 1, spinning: false, spinCount: 0 }
    }));
    setWaterTrails(prev => ({ ...prev, [trendingStock.symbol]: [] }));
    setCutbackSplashes(prev => ({ ...prev, [trendingStock.symbol]: [] }));
    setTargetPositions(prev => ({ ...prev, [trendingStock.symbol]: null }));
  }, [stocks, generatePriceHistory]);

  const removeStock = useCallback((symbol) => {
    setStocks(prev => {
      const filtered = prev.filter(s => s.symbol !== symbol);
      
      if (selectedStock === symbol) {
        if (filtered.length > 0) {
          setSelectedStock(filtered[0].symbol);
        } else {
          setSelectedStock(null);
        }
      }
      
      return filtered;
    });
    
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
  }, [selectedStock]);

  const moveStockUp = useCallback((symbol) => {
    setStocks(prev => {
      const index = prev.findIndex(s => s.symbol === symbol);
      if (index <= 0) return prev;
      const newStocks = [...prev];
      [newStocks[index - 1], newStocks[index]] = [newStocks[index], newStocks[index - 1]];
      return newStocks;
    });
  }, []);

  const moveStockDown = useCallback((symbol) => {
    setStocks(prev => {
      const index = prev.findIndex(s => s.symbol === symbol);
      if (index < 0 || index >= prev.length - 1) return prev;
      const newStocks = [...prev];
      [newStocks[index], newStocks[index + 1]] = [newStocks[index + 1], newStocks[index]];
      return newStocks;
    });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-6 pb-32">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-5xl font-bold text-white mb-2 flex items-center justify-center gap-3">
            Stock Surf 🌊
          </h1>
          <p className="text-blue-200 text-lg">
            {isMobile ? 'Touch & hold the wave to surf!' : 'Use arrow keys to carve and surf!'}
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
                    <span>Jump! Keep tapping to spin! 🌀</span>
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
                    <span>Jump! Keep pressing to SPIN! 🌀</span>
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
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <button
              onClick={() => {
                setShowMenu(true);
                setActiveMenuTab('mywaves');
              }}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-2 rounded-full flex items-center gap-2 transition-all shadow-lg"
            >
              <Info size={20} />
              Menu
            </button>
            <button
              onClick={() => {
                setShowMenu(true);
                setActiveMenuTab('add');
              }}
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-6 py-2 rounded-full flex items-center gap-2 transition-all shadow-lg"
            >
              <Plus size={20} />
              Add Wave
            </button>
          </div>
        </div>
        
        {showMenu && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowMenu(false)}>
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <div className="flex border-b border-white/20">
                <button
                  onClick={() => activeMenuTab === 'mywaves' ? setShowMenu(false) : setActiveMenuTab('mywaves')}
                  className={`flex-1 px-6 py-4 font-bold transition-all ${
                    activeMenuTab === 'mywaves' 
                      ? 'bg-blue-600 text-white' 
                      : 'text-blue-300 hover:bg-white/5'
                  }`}
                >
                  🌊 My Waves
                </button>
                <button
                  onClick={() => activeMenuTab === 'trending' ? setShowMenu(false) : setActiveMenuTab('trending')}
                  className={`flex-1 px-6 py-4 font-bold transition-all ${
                    activeMenuTab === 'trending' 
                      ? 'bg-blue-600 text-white' 
                      : 'text-blue-300 hover:bg-white/5'
                  }`}
                >
                  🔥 Trending
                </button>
                <button
                  onClick={() => activeMenuTab === 'faq' ? setShowMenu(false) : setActiveMenuTab('faq')}
                  className={`flex-1 px-6 py-4 font-bold transition-all ${
                    activeMenuTab === 'faq' 
                      ? 'bg-blue-600 text-white' 
                      : 'text-blue-300 hover:bg-white/5'
                  }`}
                >
                  🏆 Leader Board
                </button>
                <button
                  onClick={() => activeMenuTab === 'mission' ? setShowMenu(false) : setActiveMenuTab('mission')}
                  className={`flex-1 px-6 py-4 font-bold transition-all ${
                    activeMenuTab === 'mission' 
                      ? 'bg-blue-600 text-white' 
                      : 'text-blue-300 hover:bg-white/5'
                  }`}
                >
                  ℹ️ Info
                </button>
              </div>
              
              <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
                <div className="p-6">
                {activeMenuTab === 'mywaves' && (
                  <div>
                    <h2 className="text-3xl font-bold mb-4 text-white">🌊 My Waves</h2>
                    <p className="text-blue-200 mb-4">Manage your current stock waves</p>
                    
                    {stocks.length === 0 ? (
                      <div className="bg-white/5 rounded-xl p-8 border border-white/20 text-center mb-6">
                        <div className="text-4xl mb-3">🏄‍♂️</div>
                        <p className="text-blue-200 mb-4">No waves yet! Add some stocks to get started.</p>
                      </div>
                    ) : (
                      <div className="space-y-3 mb-6">
                        {stocks.map((stock, index) => {
                          const char = getCharacter(selectedChars[stock.symbol]);
                          const isSelected = selectedStock === stock.symbol;
                          const realPrice = realPrices[stock.symbol];
                          const change = priceChanges[stock.symbol];
                          
                          return (
                            <div 
                              key={stock.symbol}
                              onClick={() => {
                                setSelectedStock(stock.symbol);
                                setShowMenu(false);
                              }}
                              className={`bg-white/10 rounded-xl p-4 border-2 transition-all cursor-pointer hover:bg-white/15 ${
                                isSelected ? 'border-green-400' : 'border-white/20'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-3">
                                  <span className="text-2xl">{char?.emoji}</span>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <h3 className="text-xl font-bold text-white">{stock.symbol}</h3>
                                      {isSelected && <span className="text-green-400 text-xs font-bold">● ACTIVE</span>}
                                    </div>
                                    {realPrice && change && (
                                      <div className="flex items-center gap-2 text-sm">
                                        <span className="text-white font-semibold">${realPrice.toFixed(2)}</span>
                                        <span className={change.percent >= 0 ? 'text-green-400' : 'text-red-400'}>
                                          {change.percent >= 0 ? '↑' : '↓'} {Math.abs(change.percent).toFixed(2)}%
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      moveStockUp(stock.symbol);
                                    }}
                                    disabled={index === 0}
                                    className={`w-8 h-8 rounded flex items-center justify-center transition-all ${
                                      index === 0 
                                        ? 'bg-white/5 text-white/20 cursor-not-allowed' 
                                        : 'bg-white/20 hover:bg-white/30 text-white'
                                    }`}
                                    title="Move up"
                                  >
                                    ↑
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      moveStockDown(stock.symbol);
                                    }}
                                    disabled={index === stocks.length - 1}
                                    className={`w-8 h-8 rounded flex items-center justify-center transition-all ${
                                      index === stocks.length - 1 
                                        ? 'bg-white/5 text-white/20 cursor-not-allowed' 
                                        : 'bg-white/20 hover:bg-white/30 text-white'
                                    }`}
                                    title="Move down"
                                  >
                                    ↓
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      removeStock(stock.symbol);
                                    }}
                                    className="w-8 h-8 rounded bg-red-500/20 hover:bg-red-500/40 text-red-300 hover:text-red-100 flex items-center justify-center transition-all"
                                    title="Remove stock"
                                  >
                                    <X size={16} />
                                  </button>
                                </div>
                              </div>
                              
                              <div 
                                className="w-full h-2 rounded-full mt-2" 
                                style={{ backgroundColor: stock.color }}
                              />
                            </div>
                          );
                        })}
                      </div>
                    )}
                    
                    <div className="border-t border-white/20 pt-6">
                      <h3 className="text-xl font-bold text-white mb-4">➕ Add New Wave</h3>
                      <div className="bg-white/10 rounded-xl p-6 border border-white/20">
                        <div className="grid grid-cols-1 gap-4 mb-4">
                          <input
                            type="text"
                            placeholder="Stock Symbol (e.g., NVDA, AAPL)"
                            value={newStock.symbol}
                            onChange={(e) => setNewStock({ ...newStock, symbol: e.target.value.toUpperCase() })}
                            className="bg-white/5 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-blue-300 text-lg"
                          />
                        </div>
                        <div className="mb-4">
                          <label className="text-blue-200 text-sm mb-2 block">Wave Color</label>
                          <div className="flex gap-2 flex-wrap">
                            {colors.map(color => (
                              <button
                                key={color}
                                onClick={() => setNewStock({ ...newStock, color })}
                                className={`w-12 h-12 rounded-full border-2 transition-transform hover:scale-110 ${
                                  newStock.color === color ? 'border-white scale-110' : 'border-white/20'
                                }`}
                                style={{ backgroundColor: color }}
                              />
                            ))}
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            handleAddStock();
                          }}
                          disabled={!newStock.symbol}
                          className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-500 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg transition-colors"
                        >
                          🌊 Add Wave
                        </button>
                      </div>
                    </div>
                    
                    <div className="border-t border-white/20 pt-6 mt-6">
                      <button
                        onClick={() => setShowMenu(false)}
                        className="w-full bg-white/10 hover:bg-white/20 text-white font-bold py-3 rounded-lg transition-colors"
                      >
                        Close Menu
                      </button>
                    </div>
                  </div>
                )}
                
                {activeMenuTab === 'trending' && (
                  <div>
                    <h2 className="text-3xl font-bold mb-4 text-white">🔥 Trending Stocks</h2>
                    <p className="text-blue-200 mb-4">Click any stock to add it to your waves!</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
                      {trendingStocks.map(stock => {
                        const isAdded = stocks.some(s => s.symbol === stock.symbol);
                        return (
                          <button
                            key={stock.symbol}
                            onClick={() => {
                              if (!isAdded) {
                                addTrendingStock(stock);
                                setShowMenu(false);
                              }
                            }}
                            disabled={isAdded}
                            className={`p-4 rounded-lg border-2 transition-all text-left ${
                              isAdded 
                                ? 'bg-white/5 border-green-400 cursor-default' 
                                : 'bg-white/10 border-white/20 hover:border-white/40 hover:bg-white/20 cursor-pointer'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-2xl font-bold text-white">{stock.symbol}</span>
                              {isAdded && <span className="text-green-400 text-sm">✓ Added</span>}
                            </div>
                            <div className="text-sm text-blue-200">{stock.name}</div>
                            <div 
                              className="w-full h-2 rounded-full mt-2" 
                              style={{ backgroundColor: stock.color }}
                            />
                          </button>
                        );
                      })}
                    </div>
                    
                    <div className="border-t border-white/20 pt-6">
                      <h3 className="text-xl font-bold text-white mb-4">➕ Add New Wave</h3>
                      <div className="bg-white/10 rounded-xl p-6 border border-white/20">
                        <div className="grid grid-cols-1 gap-4 mb-4">
                          <input
                            type="text"
                            placeholder="Stock Symbol (e.g., NVDA, AAPL)"
                            value={newStock.symbol}
                            onChange={(e) => setNewStock({ ...newStock, symbol: e.target.value.toUpperCase() })}
                            className="bg-white/5 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-blue-300 text-lg"
                          />
                        </div>
                        <div className="mb-4">
                          <label className="text-blue-200 text-sm mb-2 block">Wave Color</label>
                          <div className="flex gap-2 flex-wrap">
                            {colors.map(color => (
                              <button
                                key={color}
                                onClick={() => setNewStock({ ...newStock, color })}
                                className={`w-12 h-12 rounded-full border-2 transition-transform hover:scale-110 ${
                                  newStock.color === color ? 'border-white scale-110' : 'border-white/20'
                                }`}
                                style={{ backgroundColor: color }}
                              />
                            ))}
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            handleAddStock();
                            setShowMenu(false);
                          }}
                          disabled={!newStock.symbol}
                          className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-500 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg transition-colors"
                        >
                          🌊 Add Wave
                        </button>
                      </div>
                    </div>
                    
                    <div className="border-t border-white/20 pt-6 mt-6">
                      <button
                        onClick={() => setShowMenu(false)}
                        className="w-full bg-white/10 hover:bg-white/20 text-white font-bold py-3 rounded-lg transition-colors"
                      >
                        Close Menu
                      </button>
                    </div>
                  </div>
                )}
                
                {activeMenuTab === 'add' && (
                  <div>
                    <h2 className="text-3xl font-bold mb-4 text-white">➕ Add Your Own Wave</h2>
                    <div className="bg-white/10 rounded-xl p-6 border border-white/20">
                      <div className="grid grid-cols-1 gap-4 mb-4">
                        <input
                          type="text"
                          placeholder="Stock Symbol (e.g., NVDA, AAPL)"
                          value={newStock.symbol}
                          onChange={(e) => setNewStock({ ...newStock, symbol: e.target.value.toUpperCase() })}
                          className="bg-white/5 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-blue-300 text-lg"
                        />
                      </div>
                      <div className="mb-4">
                        <label className="text-blue-200 text-sm mb-2 block">Wave Color</label>
                        <div className="flex gap-2 flex-wrap">
                          {colors.map(color => (
                            <button
                              key={color}
                              onClick={() => setNewStock({ ...newStock, color })}
                              className={`w-12 h-12 rounded-full border-2 transition-transform hover:scale-110 ${
                                newStock.color === color ? 'border-white scale-110' : 'border-white/20'
                              }`}
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          handleAddStock();
                          setShowMenu(false);
                        }}
                        disabled={!newStock.symbol}
                        className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-500 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg transition-colors"
                      >
                        🌊 Add Wave
                      </button>
                    </div>
                    
                    <div className="border-t border-white/20 pt-6 mt-6">
                      <button
                        onClick={() => setShowMenu(false)}
                        className="w-full bg-white/10 hover:bg-white/20 text-white font-bold py-3 rounded-lg transition-colors"
                      >
                        Close Menu
                      </button>
                    </div>
                  </div>
                )}
                {activeMenuTab === 'faq' && (
  <div>
    <h2 className="text-3xl font-bold mb-4 text-white">🏆 Leader Board</h2>
    <p className="text-blue-200 mb-4">Top surfers from around the world!</p>
    
    <div className="bg-white/10 rounded-xl p-4 sm:p-6 border border-white/20 mb-6">
      <h3 className="text-xl font-bold text-white mb-3">Submit Your Score</h3>
      <div className="space-y-3">
        <div>
          <label className="text-blue-200 text-sm mb-2 block">Your Name</label>
          <input
            type="text"
            placeholder="Enter your name"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-blue-300"
            maxLength={20}
          />
        </div>
        <div className="flex items-center justify-between text-blue-200">
          <span>Your Score:</span>
          <span className="text-2xl font-bold text-blue-400">{score.toLocaleString()}</span>
        </div>
        <div className="flex items-center justify-between text-blue-200">
          <span>Best Streak:</span>
          <span className="text-xl font-bold text-orange-400">{streak}🔥</span>
        </div>
        <button
          onClick={submitScore}
          disabled={!playerName.trim()}
          className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-500 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg transition-colors"
        >
          Submit Score 🎯
        </button>
      </div>
    </div>
    
    <div className="bg-white/10 rounded-xl p-4 sm:p-6 border border-white/20">
      <h3 className="text-xl font-bold text-white mb-4">Top 10 Players</h3>
      {leaderboard.length === 0 ? (
        <div className="text-center text-blue-200 py-8">
          <div className="text-4xl mb-2">🏄‍♂️</div>
          <p>No scores yet! Be the first to submit!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {leaderboard.map((entry, index) => (
            <div
              key={index}
              className={`flex items-center justify-between p-3 rounded-lg ${
                index === 0 ? 'bg-yellow-500/20 border border-yellow-500/40' :
                index === 1 ? 'bg-gray-400/20 border border-gray-400/40' :
                index === 2 ? 'bg-orange-600/20 border border-orange-600/40' :
                'bg-white/5'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold text-white w-8">
                  {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`}
                </span>
                <div>
                  <div className="font-bold text-white">{entry.name}</div>
                  <div className="text-xs text-blue-300">Streak: {entry.streak}🔥</div>
                </div>
              </div>
              <div className="text-xl font-bold text-blue-400">
                {entry.score.toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
    
    <div className="border-t border-white/20 pt-6 mt-6">
      <button
        onClick={() => setShowMenu(false)}
        className="w-full bg-white/10 hover:bg-white/20 text-white font-bold py-3 rounded-lg transition-colors"
      >
        Close Menu
      </button>
    </div>
  </div>
)}
                
                {activeMenuTab === 'mission' && (
  <div>
    <h2 className="text-3xl font-bold mb-4 text-white flex items-center gap-2">
      ℹ️ About Stock Surfer
    </h2>
    <div className="space-y-3 text-blue-100 text-base">
      <p><strong>Make watching the stock market relaxing, playful, and fun</strong> — like riding waves at the beach! 🏄‍♂️</p>
      <p>No more stressful red and green candles. Watch stocks flow as beautiful ocean waves with surfers you can control! 🥷⚡</p>
      <p>NEW: Cool water spray trails behind your surfer! 💧✨</p>
      <p>🎵 SOUND: Relaxing ocean ambience with satisfying feedback sounds!</p>
    </div>
    
    <div className="border-t border-white/20 pt-6 mt-6">
      <h2 className="text-3xl font-bold mb-4 text-white">❓ Frequently Asked Questions</h2>
      <div className="space-y-4 text-blue-100">
        <div className="bg-white/5 rounded-lg p-4">
          <h3 className="font-bold text-lg mb-2 text-blue-300">How do I play?</h3>
          <p className="text-sm">Use arrow keys (or touch on mobile) to move your surfer across the wave. Press SPACE (or tap the jump button) to jump and perform tricks!</p>
        </div>
        <div className="bg-white/5 rounded-lg p-4">
          <h3 className="font-bold text-lg mb-2 text-blue-300">What are the water effects?</h3>
          <p className="text-sm">When you change direction quickly, you'll see a cutback splash! Keep moving to see beautiful water trails behind your surfer.</p>
        </div>
        <div className="bg-white/5 rounded-lg p-4">
          <h3 className="font-bold text-lg mb-2 text-blue-300">How do I spin?</h3>
          <p className="text-sm">Jump first, then keep pressing SPACE (or tapping the jump button) while in the air to perform spinning tricks! The more you spin, the cooler the effects!</p>
        </div>
        <div className="bg-white/5 rounded-lg p-4">
          <h3 className="font-bold text-lg mb-2 text-blue-300">How do I unlock characters?</h3>
          <p className="text-sm">Build streaks and score points! Each character has specific unlock conditions shown when you hover over them.</p>
        </div>
        <div className="bg-white/5 rounded-lg p-4">
          <h3 className="font-bold text-lg mb-2 text-blue-300">Are these real stock prices?</h3>
          <p className="text-sm">Yes! The game fetches real-time stock prices and displays them on each wave. The price changes update automatically.</p>
        </div>
        <div className="bg-white/5 rounded-lg p-4">
          <h3 className="font-bold text-lg mb-2 text-blue-300">Can I add my own stocks?</h3>
          <p className="text-sm">Absolutely! Click the "Add Waves" tab to add any stock symbol you want to watch. You can also pick from our trending stocks list!</p>
        </div>
      </div>
    </div>
    
    <div className="border-t border-white/20 pt-6 mt-6">
      <h3 className="text-2xl font-bold mb-4 text-white">🌊 Our Story — Ride the Wave With Us</h3>
      <div className="space-y-3 text-blue-100 text-base">
        <p>Hi there! 👋 We're the small, curious team behind <strong>Wave Stock Surfer</strong> — a weird, fun experiment that turned into something way bigger than we expected.</p>
        <p>It all started with a simple idea: <strong>What if checking stock prices felt like surfing?</strong> Not stressful. Not boring. Just... fun.</p>
        <p>So we built a tiny prototype in our living room. No money, no investors — just passion, snacks, and a ridiculous amount of trial and error. Eventually, we launched Wave Stock Surfer, and to our surprise, people <em>loved</em> it. Gamers, traders, kids, parents... everyone started catching the wave.</p>
        <p>And now you're here. Which means the wave is still growing. 🌊✨</p>
      </div>
      
      <h3 className="text-2xl font-bold mb-4 mt-6 text-white">💙 Why We Ask for Support</h3>
      <div className="space-y-3 text-blue-100 text-base">
        <p>We don't run ads. We don't sell data. We don't lock features behind paywalls.</p>
        <p>Wave Stock Surfer runs on our nights, weekends, caffeine, and the support of people who believe in what we're building.</p>
        <p>If our game has made you smile... If you've enjoyed checking your daily trends in a new way... If you just like supporting small indie creators...</p>
        <p>Then your donation — even $1 — helps us:</p>
        <ul className="list-disc list-inside space-y-1 ml-4">
          <li>💻 Keep the servers running</li>
          <li>🎮 Add new features</li>
          <li>🎉 Release fun updates & events</li>
          <li>🆓 Keep the game totally free for everyone</li>
        </ul>
        <p>We want to keep building Wave Stock Surfer into something special, and <strong>your support is what makes that possible.</strong></p>
      </div>
      
      <h3 className="text-2xl font-bold mb-4 mt-6 text-white">🙏 Support the Wave</h3>
      <div className="space-y-3 text-blue-100 text-base">
        <p>If you'd like to help us keep improving the game, you can donate at the bottom of the page.</p>
<p>No pressure, no expectations — just good vibes and gratitude. 🏄‍♂️💙</p>
        <p>Every little bit helps us keep riding this crazy wave with you.</p>
        <p className="text-lg font-semibold">Thank you for being part of our journey. Let's keep surfing. 🌊🎮</p>
      </div>
    </div>
    
    <div className="border-t border-white/20 pt-6 mt-6">
      <button
        onClick={() => setShowMenu(false)}
        className="w-full bg-white/10 hover:bg-white/20 text-white font-bold py-3 rounded-lg transition-colors"
      >
        Close Menu
      </button>
    </div>
  </div>
)}
                </div>
              </div>
            </div>
          </div>
        )}

        {celebration && (
          <div className="fixed top-0 left-0 w-screen h-screen z-50 flex items-center justify-center pointer-events-none">
            <div className="text-2xl animate-bounce text-center">🎉✨🏆✨🎉</div>
          </div>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {stocks.length === 0 ? (
            <div className="col-span-full bg-white/10 backdrop-blur-md rounded-2xl p-12 border-2 border-white/20 text-center">
              <div className="text-6xl mb-4">🌊</div>
              <h3 className="text-2xl font-bold text-white mb-2">No waves yet!</h3>
              <p className="text-blue-200 mb-6">Add some stocks to start surfing</p>
              <button
                onClick={() => {
                  setShowMenu(true);
                  setActiveMenuTab('mywaves');
                }}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-3 rounded-full inline-flex items-center gap-2 transition-all shadow-lg"
              >
                <Plus size={20} />
                Add Your First Wave
              </button>
            </div>
          ) : (
            stocks.map((stock, index) => {
            const char = getCharacter(selectedChars[stock.symbol]);
            const isSelected = selectedStock === stock.symbol;
            
            return (
              <div 
                key={stock.symbol}
                onClick={() => setSelectedStock(stock.symbol)}
                onTouchStart={(e) => handleStockCardTouch(e, stock.symbol)}
                onTouchMove={(e) => handleStockCardTouch(e, stock.symbol)}
                onTouchEnd={handleCanvasTouchEnd}
                className={`bg-white/10 backdrop-blur-md rounded-2xl p-5 border-2 transition-all cursor-pointer relative select-none ${
                  isSelected ? 'border-green-400 shadow-xl shadow-green-400/20' : 'border-white/20 hover:border-white/40'
                }`}
                style={{ touchAction: 'none', WebkitUserSelect: 'none', userSelect: 'none' }}
              >
                <div className="absolute top-4 right-4 z-10">
  <button
    onClick={(e) => {
      e.stopPropagation();
      removeStock(stock.symbol);
    }}
    className="text-white/50 hover:text-white transition-colors"
    title="Remove stock"
  >
    <X size={16} />
  </button>
</div>
                
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
                      </div>
                    </div>
                  </div>
                </div>
                
                <canvas
                  ref={el => canvasRefs.current[stock.symbol] = el}
                  width={600}
                  height={200}
                  className="w-full h-48 mb-3 rounded-lg cursor-pointer pointer-events-none select-none"
                  style={{ touchAction: 'none', WebkitUserSelect: 'none', userSelect: 'none' }}
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
          }))}
        </div>
        
        <div className="text-center text-blue-200 text-sm mb-6">
          <div>💡 Unlocked: {unlockedChars.length}/{characters.length} characters • Build streaks to unlock more!</div>
          <div className="mt-2 text-xs opacity-75">This site is for entertainment purposes only and does not provide financial advice.</div>
        </div>

        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <button
              onClick={() => {
                setShowMenu(true);
                setActiveMenuTab('mywaves');
              }}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3 rounded-full flex items-center gap-2 transition-all shadow-lg"
            >
              <Info size={20} />
              Menu
            </button>
            <button
              onClick={() => {
                setShowMenu(true);
                setActiveMenuTab('add');
              }}
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-6 py-3 rounded-full flex items-center gap-2 transition-all shadow-lg"
            >
              <Plus size={20} />
              Add Wave
            </button>
            <button
              onClick={toggleSound}
              className={`px-6 py-3 rounded-full font-bold transition-all shadow-lg ${
                soundEnabled 
                  ? 'bg-green-500 hover:bg-green-600 text-white' 
                  : 'bg-gray-500 hover:bg-gray-600 text-white'
              }`}
            >
              {soundEnabled ? '🔊 Sound ON' : '🔇 Sound OFF'}
            </button>
          </div>
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
      
      {isMobile && (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
          <button
            onTouchStart={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleJump();
            }}
            onClick={handleJump}
            className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full border-4 border-white/30 shadow-2xl flex items-center justify-center text-4xl active:scale-95 transition-transform select-none"
            style={{ touchAction: 'none', WebkitUserSelect: 'none', userSelect: 'none' }}
          >
            ⬆️
          </button>
        </div>
      )}
    </div>
  );
};

export default WaveStockSurfer;