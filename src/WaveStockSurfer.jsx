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
    { symbol: 'GME', color: '#EC4899', history: generatePriceHistory(25, 0.045, 50), selectedChar: 'goku' },
    { symbol: 'AAPL', color: '#60A5FA', history: generatePriceHistory(170, 0.02, 50), selectedChar: 'vegeta' },
    { symbol: 'GOOGL', color: '#34D399', history: generatePriceHistory(140, 0.025, 50), selectedChar: 'goku' },
    { symbol: 'TSLA', color: '#F87171', history: generatePriceHistory(250, 0.04, 50), selectedChar: 'vegeta' }
  ], [generatePriceHistory]);

  const [stocks, setStocks] = useState(initialStocks);
  const [selectedStock, setSelectedStock] = useState('GME');
  const [selectedChars, setSelectedChars] = useState({
    GME: 'goku', AAPL: 'vegeta', GOOGL: 'goku', TSLA: 'vegeta'
  });

  const [surferPositions, setSurferPositions] = useState(
    stocks.reduce((acc, stock) => ({
      ...acc,
      [stock.symbol]: { x: 0.3, y: 0.5, jumping: false, hasRocket: false }
    }), {})
  );

  const [rockets, setRockets] = useState(
    stocks.reduce((acc, stock) => ({ ...acc, [stock.symbol]: [] }), {})
  );

  const [waterTrails, setWaterTrails] = useState(
    stocks.reduce((acc, stock) => ({ ...acc, [stock.symbol]: [] }), {})
  );

  const canvasRefs = useRef({});
  const timeRef = useRef(0);
  const keysPressed = useRef({});

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile('ontouchstart' in window || navigator.maxTouchPoints > 0);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Target position for smooth movement
  const [targetPositions, setTargetPositions] = useState(
    stocks.reduce((acc, stock) => ({ ...acc, [stock.symbol]: null }), {})
  );

  // Track if user is holding touch
  const [isTouching, setIsTouching] = useState(false);

  const handleCanvasTouch = useCallback((e, stockSymbol) => {
    if (stockSymbol !== selectedStock) return;
    e.preventDefault();
    setIsTouching(true);

    const canvas = canvasRefs.current[stockSymbol];
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    const normalizedX = Math.max(0.05, Math.min(0.95, x / rect.width));
    const normalizedY = Math.max(0.3, Math.min(1.0, y / rect.height));

    setTargetPositions(prev => ({ ...prev, [stockSymbol]: { x: normalizedX, y: normalizedY } }));
  }, [selectedStock]);

  const handleCanvasTouchEnd = useCallback(() => {
    setIsTouching(false);
  }, []);

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

  // Movement interval: includes hold-to-move and prevent over-top wave
  useEffect(() => {
    const moveInterval = setInterval(() => {
      if (!selectedStock) return;

      setSurferPositions(prev => {
        const current = prev[selectedStock];
        let newX = current.x;
        let newY = current.y;

        // Smooth movement toward target if touching
        const target = isTouching ? targetPositions[selectedStock] : null;
        if (target) {
          const deltaX = target.x - current.x;
          const deltaY = target.y - current.y;
          const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

          if (distance > 0.01) {
            const speed = 0.04;
            newX = current.x + (deltaX / distance) * Math.min(speed, distance);
            newY = current.y + (deltaY / distance) * Math.min(speed, distance);
          }
        }

        // Keyboard controls override
        if (keysPressed.current['ArrowLeft']) { newX = Math.max(0.05, newX - 0.02); }
        if (keysPressed.current['ArrowRight']) { newX = Math.min(0.95, newX + 0.02); }
        if (keysPressed.current['ArrowUp']) { newY = current.hasRocket ? Math.max(-0.2, newY - 0.02) : Math.max(0.5, newY - 0.02); }
        if (keysPressed.current['ArrowDown']) { newY = Math.min(1.2, newY + 0.02); }

        // Clamp Y so surfer can't go above wave unless jumping
        if (!current.jumping) newY = Math.max(newY, 0.3);

        return { ...prev, [selectedStock]: { ...current, x: newX, y: newY } };
      });
    }, 30);

    return () => clearInterval(moveInterval);
  }, [selectedStock, targetPositions, isTouching]);

  // ... rest of your code remains unchanged
  // All drawing, score, trails, UI, jump button, stock addition, removal, mission, celebration, etc.

  // Make sure to add these handlers to canvas:
  // onTouchEnd={handleCanvasTouchEnd}
  // onTouchCancel={handleCanvasTouchEnd}
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-6 pb-32">
      {/* ... all your existing JSX UI remains unchanged ... */}
      {stocks.map(stock => (
        <canvas
          key={stock.symbol}
          ref={el => canvasRefs.current[stock.symbol] = el}
          width={600}
          height={200}
          className="w-full h-48 mb-3 rounded-lg cursor-pointer"
          onTouchStart={(e) => handleCanvasTouch(e, stock.symbol)}
          onTouchMove={(e) => handleCanvasTouch(e, stock.symbol)}
          onTouchEnd={handleCanvasTouchEnd}
          onTouchCancel={handleCanvasTouchEnd}
          onClick={(e) => handleCanvasTouch(e, stock.symbol)}
          style={{ touchAction: 'none' }}
        />
      ))}
    </div>
  );
};

export default WaveStockSurfer;
