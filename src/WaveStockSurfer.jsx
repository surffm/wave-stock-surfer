import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Sparkles, Zap, TrendingUp, Info, Plus, X } from 'lucide-react';
import { createChart } from 'lightweight-charts';

const WaveStockSurfer = () => {
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [multiplier, setMultiplier] = useState(1);
  const [showMenu, setShowMenu] = useState(false);
  const [activeMenuTab, setActiveMenuTab] = useState('mywaves');
  const [powerUp, setPowerUp] = useState(null);
  const [celebration, setCelebration] = useState(false);
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
    { symbol: 'MSTR', name: 'Block', color: '#00D924' },
    { symbol: 'UBER', name: 'Uber', color: '#000000' }
  ], []);

  const colors = useMemo(() => ['#60A5FA', '#34D399', '#F87171', '#FBBF24', '#A78BFA', '#EC4899', '#14B8A6'], []);
  const [unlockedChars, setUnlockedChars] = useState(['goku', 'vegeta']);
  const [powerUpCount, setPowerUpCount] = useState(0);

  const getCryptoSymbol = useCallback((symbol) => {
    const cryptoMap = {
      'BTC': 'BINANCE:BTCUSDT',
      'ETH': 'BINANCE:ETHUSDT',
      'SOL': 'BINANCE:SOLUSDT',
      'DOGE': 'BINANCE:DOGEUSDT',
      'XRP': 'BINANCE:XRPUSDT',
      'ADA': 'BINANCE:ADAUSDT',
      'AVAX': 'BINANCE:AVAXUSDT',
      'MATIC': 'BINANCE:MATICUSDT',
      'LINK': 'BINANCE:LINKUSDT',
      'UNI': 'BINANCE:UNIUSDT',
    };
    return cryptoMap[symbol] || symbol;
  }, []);

  // Fetch historical candlestick data from Finnhub
  const fetchHistoricalData = useCallback(async (symbol) => {
    try {
      const apiSymbol = getCryptoSymbol(symbol);
      const to = Math.floor(Date.now() / 1000);
      const from = to - (30 * 24 * 60 * 60); // 30 days ago
      
      const response = await fetch(
        `https://finnhub.io/api/v1/stock/candle?symbol=${apiSymbol}&resolution=D&from=${from}&to=${to}&token=d49emh9r01qshn3lui9gd49emh9r01qshn3luia0`
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.s === 'ok' && data.t && data.t.length > 0) {
          // Convert to TradingView format
          return data.t.map((time, i) => ({
            time: time,
            open: data.o[i],
            high: data.h[i],
            low: data.l[i],
            close: data.c[i]
          }));
        }
      }
      return null;
    } catch (error) {
      console.error(`Error fetching historical data for ${symbol}:`, error);
      return null;
    }
  }, [getCryptoSymbol]);
  
  const initialStocks = useMemo(() => [
    { symbol: 'GME', color: '#34D399', selectedChar: 'goku', chartData: null },
    { symbol: 'AAPL', color: '#60A5FA', selectedChar: 'vegeta', chartData: null },
    { symbol: 'GOOGL', color: '#EC4899', selectedChar: 'goku', chartData: null },
    { symbol: 'TSLA', color: '#F87171', selectedChar: 'vegeta', chartData: null }
  ], []);
  
  const [stocks, setStocks] = useState(initialStocks);
  const [selectedStock, setSelectedStock] = useState('GME');
  const [selectedChars, setSelectedChars] = useState({ GME: 'goku', AAPL: 'vegeta', GOOGL: 'goku', TSLA: 'vegeta' });
  const [surferPositions, setSurferPositions] = useState(stocks.reduce((acc, stock) => ({ 
    ...acc, 
    [stock.symbol]: { x: 0.5, y: 0.5, jumping: false, direction: 1, spinning: false, spinCount: 0 } 
  }), {}));
  
  const chartContainerRefs = useRef({});
  const chartInstancesRef = useRef({});
  const seriesRef = useRef({});
  const timeRef = useRef(0);
  const keysPressed = useRef({});
  const previousX = useRef({});
  const [targetPositions, setTargetPositions] = useState(stocks.reduce((acc, stock) => ({ ...acc, [stock.symbol]: null }), {}));
  const touchingRef = useRef(false);
  const currentTouchStock = useRef(null);
  
  // Initialize audio (keeping existing audio code)
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

  const playJumpSound = useCallback(() => {
    if (!soundEnabled || !audioContextRef.current) return;
    try {
      const ctx = audioContextRef.current;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(800, now + 0.1);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
      osc.connect(gain);
      gain.connect(masterGainRef.current);
      osc.start(now);
      osc.stop(now + 0.2);
    } catch (error) {
      console.error("Jump sound error:", error);
    }
  }, [soundEnabled]);

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
  
  // Fetch current prices
  const fetchStockPrices = useCallback(async () => {
    setFetchingPrices(true);
    const newPrices = {};
    const newChanges = {};
    
    for (const stock of stocks) {
      try {
        const apiSymbol = getCryptoSymbol(stock.symbol);
        
        const finnhubResponse = await fetch(
          `https://finnhub.io/api/v1/quote?symbol=${apiSymbol}&token=d49emh9r01qshn3lui9gd49emh9r01qshn3luia0`
        );
        
        if (finnhubResponse.ok) {
          const finnhubData = await finnhubResponse.json();
          if (finnhubData.c && finnhubData.c > 0) {
            newPrices[stock.symbol] = finnhubData.c;
            newChanges[stock.symbol] = {
              amount: finnhubData.d || 0,
              percent: finnhubData.dp || 0
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
  }, [stocks, getCryptoSymbol]);

  // Initialize charts for all stocks
  useEffect(() => {
    const initializeCharts = async () => {
      for (const stock of stocks) {
        if (!chartContainerRefs.current[stock.symbol]) continue;
        
        // Fetch historical data
        const historicalData = await fetchHistoricalData(stock.symbol);
        if (!historicalData) continue;

        // Create chart
        const container = chartContainerRefs.current[stock.symbol];
        if (chartInstancesRef.current[stock.symbol]) {
          chartInstancesRef.current[stock.symbol].remove();
        }

        const chart = createChart(container, {
          width: container.clientWidth,
          height: 200,
          layout: {
            background: { color: 'transparent' },
            textColor: '#ffffff',
          },
          grid: {
            vertLines: { color: 'rgba(255, 255, 255, 0.1)' },
            horzLines: { color: 'rgba(255, 255, 255, 0.1)' },
          },
          crosshair: {
            mode: 0,
          },
          timeScale: {
            borderColor: 'rgba(255, 255, 255, 0.3)',
            timeVisible: true,
          },
          rightPriceScale: {
            borderColor: 'rgba(255, 255, 255, 0.3)',
          },
        });

        const areaSeries = chart.addAreaSeries({
          topColor: stock.color + '80',
          bottomColor: stock.color + '20',
          lineColor: stock.color,
          lineWidth: 3,
        });

        areaSeries.setData(historicalData.map(d => ({
          time: d.time,
          value: d.close
        })));

        chartInstancesRef.current[stock.symbol] = chart;
        seriesRef.current[stock.symbol] = areaSeries;

        // Handle resize
        const handleResize = () => {
          chart.applyOptions({ width: container.clientWidth });
        };
        window.addEventListener('resize', handleResize);
      }
    };

    initializeCharts();

    return () => {
      Object.values(chartInstancesRef.current).forEach(chart => {
        try {
          chart.remove();
        } catch (e) {}
      });
    };
  }, [stocks, fetchHistoricalData]);

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
    if (!playerName.trim()) return;
    
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
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, [initAudio, soundEnabled]);

  const handleJump = useCallback(() => {
    if (selectedStock) {
      setSurferPositions(prev => {
        const current = prev[selectedStock];
        if (current.jumping && current.spinning) {
          return {
            ...prev,
            [selectedStock]: {
              ...current,
              spinCount: current.spinCount + 1
            }
          };
        } else if (current.jumping) {
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
  }, [selectedStock, playJumpSound]);
  
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!keysPressed.current[e.key]) {
        keysPressed.current[e.key] = true;
        if (e.key === ' ' && selectedStock) {
          handleJump();
        }
      }
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault();
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
  }, [selectedStock, handleJump]);

  // Handle surfer movement
  useEffect(() => {
    const moveInterval = setInterval(() => {
      if (!selectedStock) return;
      setSurferPositions(prev => {
        const current = prev[selectedStock];
        let newX = current.x;
        let newY = current.y;
        let newDirection = current.direction;
        
        if (keysPressed.current['ArrowLeft']) {
          newX = Math.max(0.05, newX - 0.02);
          if (newX < current.x) newDirection = -1;
        }
        if (keysPressed.current['ArrowRight']) {
          newX = Math.min(0.95, newX + 0.02);
          if (newX > current.x) newDirection = 1;
        }
        if (keysPressed.current['ArrowUp']) {
          newY = Math.max(0.1, newY - 0.02);
        }
        if (keysPressed.current['ArrowDown']) {
          newY = Math.min(0.9, newY + 0.02);
        }
        
        return { ...prev, [selectedStock]: { ...current, x: newX, y: newY, direction: newDirection } };
      });
    }, 16);
    return () => clearInterval(moveInterval);
  }, [selectedStock]);

  useEffect(() => {
    const newUnlocked = [...unlockedChars];
    if (streak >= 5 && !newUnlocked.includes('gohan')) newUnlocked.push('gohan');
    if (score >= 1000 && !newUnlocked.includes('piccolo')) newUnlocked.push('piccolo');
    if (powerUpCount >= 3 && !newUnlocked.includes('trunks')) newUnlocked.push('trunks');
    if (streak >= 10 && !newUnlocked.includes('krillin')) newUnlocked.push('krillin');
    if (streak >= 20 && !newUnlocked.includes('dolphin')) newUnlocked.push('dolphin');
    if (score >= 5000 && !newUnlocked.includes('cat')) newUnlocked.push('cat');
    if (powerUpCount >= 10 && !newUnlocked.includes('unicorn')) newUnlocked.push('unicorn');
    if (streak >= 15 && !newUnlocked.includes('wolf')) newUnlocked.push('wolf');
    setUnlockedChars(newUnlocked);
  }, [streak, score, powerUpCount, unlockedChars]);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setScore(s => s + (Math.floor(Math.random() * 50) + 20) * multiplier);
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
        setPowerUp(['speed', 'glow', 'foam', 'multiplier'][Math.floor(Math.random() * 4)]);
        setPowerUpCount(c => c + 1);
        setTimeout(() => setPowerUp(null), 3000);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [multiplier]);

  const selectCharacter = useCallback((stockSymbol, charId) => {
    if (unlockedChars.includes(charId)) setSelectedChars(prev => ({ ...prev, [stockSymbol]: charId }));
  }, [unlockedChars]);
  
  const getCharacter = useCallback((charId) => characters.find(c => c.id === charId), [characters]);

  const handleAddStock = useCallback(async (symbol, color) => {
    if (stocks.some(s => s.symbol === symbol.toUpperCase())) return;
    
    const newStockData = {
      symbol: symbol.toUpperCase(),
      color: color,
      selectedChar: 'goku',
      chartData: null
    };
    
    setStocks(prev => [newStockData, ...prev]);
    setSelectedChars(prev => ({ ...prev, [symbol.toUpperCase()]: 'goku' }));
    setSurferPositions(prev => ({ 
      ...prev, 
      [symbol.toUpperCase()]: { x: 0.5, y: 0.5, jumping: false, direction: 1, spinning: false, spinCount: 0 }
    }));
  }, [stocks]);

  const addTrendingStock = useCallback((trendingStock) => {
    if (stocks.some(s => s.symbol === trendingStock.symbol)) return;
    handleAddStock(trendingStock.symbol, trendingStock.color);
  }, [stocks, handleAddStock]);

  const removeStock = useCallback((symbol) => {
    setStocks(prev => {
      const filtered = prev.filter(s => s.symbol !== symbol);
      if (selectedStock === symbol && filtered.length > 0) {
        setSelectedStock(filtered[0].symbol);
      }
      return filtered;
    });
    
    if (chartInstancesRef.current[symbol]) {
      try {
        chartInstancesRef.current[symbol].remove();
        delete chartInstancesRef.current[symbol];
        delete seriesRef.current[symbol];
      } catch (e) {}
    }
  }, [selectedStock]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-5xl font-bold text-white mb-2 flex items-center justify-center gap-3">
            Stock Surf 🌊
          </h1>
          <p className="text-blue-200 text-lg">
            {isMobile ? 'Touch to surf!' : 'Use arrow keys & SPACE to surf real charts!'}
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
            </div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
            <h2 className="text-xl font-bold text-white mb-3">Controls</h2>
            <div className="space-y-2 text-sm text-blue-200">
              <div>← → : Move along the chart</div>
              <div>↑ ↓ : Move up/down</div>
              <div>SPACE : Jump & Spin!</div>
            </div>
          </div>
        </div>

        {celebration && (
          <div className="fixed top-0 left-0 w-screen h-screen z-50 flex items-center justify-center pointer-events-none">
            <div className="text-6xl animate-bounce">🎉✨🏆✨🎉</div>
          </div>
        )}

        {stocks.length === 0 ? (
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-12 border-2 border-white/20 text-center mb-6">
            <div className="text-6xl mb-4">🌊</div>
            <h3 className="text-2xl font-bold text-white mb-2">No charts yet!</h3>
            <p className="text-blue-200 mb-6">Add stocks to see real TradingView charts</p>
            <button
              onClick={() => {
                setShowMenu(true);
                setActiveMenuTab('add');
              }}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-3 rounded-full inline-flex items-center gap-2 transition-all shadow-lg"
            >
              <Plus size={20} />
              Add Your First Stock
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {stocks.map((stock) => {
              const char = getCharacter(selectedChars[stock.symbol]);
              const isSelected = selectedStock === stock.symbol;
              const surferPos = surferPositions[stock.symbol];
              const realPrice = realPrices[stock.symbol];
              const change = priceChanges[stock.symbol];
              
              return (
                <div 
                  key={stock.symbol}
                  onClick={() => setSelectedStock(stock.symbol)}
                  className={`bg-white/10 backdrop-blur-md rounded-2xl p-5 border-2 transition-all cursor-pointer relative ${
                    isSelected ? 'border-green-400 shadow-xl shadow-green-400/20' : 'border-white/20 hover:border-white/40'
                  }`}
                >
                  <div className="absolute top-4 right-4 z-10">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeStock(stock.symbol);
                      }}
                      className="text-white/50 hover:text-white transition-colors"
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
                      </div>
                    </div>
                    {realPrice && change && (
                      <div className="flex items-center gap-3 text-sm">
                        <span className="text-white font-semibold text-lg">${realPrice.toFixed(2)}</span>
                        <span className={`font-semibold ${change.percent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {change.percent >= 0 ? '↑' : '↓'} {Math.abs(change.percent).toFixed(2)}%
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="relative">
                    <div 
                      ref={el => chartContainerRefs.current[stock.symbol] = el}
                      className="w-full h-[200px] rounded-lg overflow-hidden"
                    />
                    
                    {surferPos && (
                      <div
                        className="absolute pointer-events-none transition-all duration-100"
                        style={{
                          left: `${surferPos.x * 100}%`,
                          top: `${surferPos.y * 100}%`,
                          transform: `translate(-50%, -50%) ${surferPos.jumping ? 'translateY(-30px)' : ''} ${surferPos.spinning ? `rotate(${timeRef.current * 360}deg)` : ''}`,
                          fontSize: '32px',
                          filter: isSelected ? 'drop-shadow(0 0 10px #00ff00)' : 'none',
                          zIndex: 10
                        }}
                      >
                        {char?.emoji}
                      </div>
                    )}
                  </div>
                  
                  <div className="border-t border-white/20 pt-3 mt-3">
                    <div className="text-blue-200 text-xs mb-2">Select Surfer:</div>
                    <div className="flex gap-2 flex-wrap">
                      {characters.slice(0, 6).map(char => {
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
        )}

        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <button
              onClick={() => {
                setShowMenu(true);
                setActiveMenuTab('add');
              }}
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-6 py-3 rounded-full flex items-center gap-2 transition-all shadow-lg"
            >
              <Plus size={20} />
              Add Stock
            </button>
            <button
              onClick={() => {
                setShowMenu(true);
                setActiveMenuTab('trending');
              }}
              className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white px-6 py-3 rounded-full flex items-center gap-2 transition-all shadow-lg"
            >
              🔥 Trending
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

        {showMenu && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center p-4 pt-20 overflow-y-auto" onClick={() => setShowMenu(false)}>
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl shadow-2xl max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
              <div className="flex border-b border-white/20">
                <button
                  onClick={() => setActiveMenuTab('add')}
                  className={`flex-1 px-6 py-4 font-bold transition-all ${
                    activeMenuTab === 'add' ? 'bg-blue-600 text-white' : 'text-blue-300 hover:bg-white/5'
                  }`}
                >
                  ➕ Add Stock
                </button>
                <button
                  onClick={() => setActiveMenuTab('trending')}
                  className={`flex-1 px-6 py-4 font-bold transition-all ${
                    activeMenuTab === 'trending' ? 'bg-blue-600 text-white' : 'text-blue-300 hover:bg-white/5'
                  }`}
                >
                  🔥 Trending
                </button>
                <button
                  onClick={() => setActiveMenuTab('leaderboard')}
                  className={`flex-1 px-6 py-4 font-bold transition-all ${
                    activeMenuTab === 'leaderboard' ? 'bg-blue-600 text-white' : 'text-blue-300 hover:bg-white/5'
                  }`}
                >
                  🏆 Leaderboard
                </button>
              </div>
              
              <div className="p-6 max-h-[70vh] overflow-y-auto">
                {activeMenuTab === 'add' && (
                  <div>
                    <h2 className="text-3xl font-bold mb-4 text-white">➕ Add Stock</h2>
                    <p className="text-blue-200 mb-4">Enter any stock symbol to add real chart data</p>
                    <div className="bg-white/10 rounded-xl p-6 border border-white/20">
                      <input
                        type="text"
                        placeholder="Stock Symbol (e.g., NVDA, AAPL)"
                        value={newStock.symbol}
                        onChange={(e) => setNewStock({ ...newStock, symbol: e.target.value.toUpperCase() })}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && newStock.symbol) {
                            handleAddStock(newStock.symbol, newStock.color);
                            setNewStock({ symbol: '', color: colors[0] });
                            setShowMenu(false);
                          }
                        }}
                        className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-blue-300 text-lg mb-4"
                      />
                      <div className="mb-4">
                        <label className="text-blue-200 text-sm mb-2 block">Chart Color</label>
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
                          handleAddStock(newStock.symbol, newStock.color);
                          setNewStock({ symbol: '', color: colors[0] });
                          setShowMenu(false);
                        }}
                        disabled={!newStock.symbol}
                        className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-500 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg transition-colors"
                      >
                        🌊 Add Chart
                      </button>
                    </div>
                  </div>
                )}
                
                {activeMenuTab === 'trending' && (
                  <div>
                    <h2 className="text-3xl font-bold mb-4 text-white">🔥 Trending Stocks</h2>
                    <p className="text-blue-200 mb-4">Click to add popular stocks with real charts</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
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
                            className={`p-4 rounded-lg border-2 transition-all ${
                              isAdded 
                                ? 'bg-white/5 border-green-400 cursor-default' 
                                : 'bg-white/10 border-white/20 hover:border-white/40 hover:bg-white/20 cursor-pointer'
                            }`}
                          >
                            <div className="text-xl font-bold text-white mb-1">{stock.symbol}</div>
                            <div className="text-xs text-blue-200">{stock.name}</div>
                            {isAdded && <div className="text-green-400 text-sm mt-2">✓ Added</div>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                {activeMenuTab === 'leaderboard' && (
                  <div>
                    <h2 className="text-3xl font-bold mb-4 text-white">🏆 Leaderboard</h2>
                    <div className="bg-white/10 rounded-xl p-4 border border-white/20 mb-6">
                      <h3 className="text-xl font-bold text-white mb-3">Submit Your Score</h3>
                      <input
                        type="text"
                        placeholder="Your name"
                        value={playerName}
                        onChange={(e) => setPlayerName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && playerName.trim()) {
                            submitScore();
                          }
                        }}
                        className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-blue-300 mb-3"
                        maxLength={20}
                      />
                      <div className="flex justify-between text-blue-200 mb-3">
                        <span>Score: {score.toLocaleString()}</span>
                        <span>Streak: {streak}🔥</span>
                      </div>
                      <button
                        onClick={submitScore}
                        disabled={!playerName.trim()}
                        className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-500 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg transition-colors"
                      >
                        Submit Score
                      </button>
                    </div>
                    
                    <div className="bg-white/10 rounded-xl p-4 border border-white/20">
                      <h3 className="text-xl font-bold text-white mb-4">Top 10</h3>
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
                              <span className="text-xl font-bold text-white w-8">
                                {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`}
                              </span>
                              <div>
                                <div className="font-bold text-white">{entry.name}</div>
                                <div className="text-xs text-blue-300">Streak: {entry.streak}🔥</div>
                              </div>
                            </div>
                            <div className="text-lg font-bold text-blue-400">
                              {entry.score.toLocaleString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="border-t border-white/20 p-4">
                <button
                  onClick={() => setShowMenu(false)}
                  className="w-full bg-white/10 hover:bg-white/20 text-white font-bold py-3 rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="text-center text-blue-200 text-sm">
          <div>💡 Surf real stock charts powered by TradingView & Finnhub</div>
          <div className="mt-2 text-xs opacity-75">Entertainment purposes only • Not financial advice</div>
        </div>
      </div>
      
      {isMobile && (
        <div className="fixed bottom-6 right-6 z-50">
          <button
            onClick={handleJump}
            className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full border-4 border-white/30 shadow-2xl flex items-center justify-center text-4xl active:scale-95 transition-transform"
          >
            ⬆️
          </button>
        </div>
      )}
    </div>
  );
};

export default WaveStockSurfer;