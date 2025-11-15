import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Sparkles, Zap, TrendingUp, Info, Plus, X } from 'lucide-react';

const WaveStockSurfer = () => {
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [multiplier, setMultiplier] = useState(1);
  const [selectedStock, setSelectedStock] = useState('AAPL');
  const [targetPositions, setTargetPositions] = useState({});
  const canvasRefs = useRef({});
  const touchingRef = useRef(false);
  const currentTouchStock = useRef(null);
  const positions = useRef({ AAPL: { x: 0.5, y: 1 }, MSFT: { x: 0.5, y: 1 } }); // example stocks

  // Handle mobile tap and hold
  const handleStockCardTouch = useCallback((e, stockSymbol) => {
    if (stockSymbol !== selectedStock) return;
    e.preventDefault();
    const canvas = canvasRefs.current[stockSymbol];
    if (!canvas) return;

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const canvasRect = canvas.getBoundingClientRect();
    const normalizedX = Math.max(0.05, Math.min(0.95, (clientX - canvasRect.left) / canvasRect.width));
    const normalizedY = Math.max(0.1, Math.min(1.5, (clientY - canvasRect.top) / canvasRect.height));

    setTargetPositions(prev => ({ ...prev, [stockSymbol]: { x: normalizedX, y: normalizedY } }));
    touchingRef.current = true;
    currentTouchStock.current = stockSymbol;
  }, [selectedStock]);

  const handleCanvasTouchEnd = useCallback(() => {
    touchingRef.current = false;
    currentTouchStock.current = null;
    if (selectedStock) setTargetPositions(prev => ({ ...prev, [selectedStock]: null }));
  }, [selectedStock]);

  // Smooth movement toward target positions
  useEffect(() => {
    const interval = setInterval(() => {
      if (!selectedStock) return;
      const current = positions.current[selectedStock];
      const target = targetPositions[selectedStock];
      if (target) {
        let newX = current.x;
        let newY = current.y;
        const deltaX = target.x - current.x;
        const deltaY = target.y - current.y;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        if (distance > 0.005) {
          const speed = 0.08;
          newX = current.x + (deltaX / distance) * Math.min(speed, distance);
          newY = current.y + (deltaY / distance) * Math.min(speed, distance);
        } else if (!touchingRef.current || currentTouchStock.current !== selectedStock) {
          setTargetPositions(prev => ({ ...prev, [selectedStock]: null }));
        }
        positions.current[selectedStock] = { x: newX, y: newY };
      }
    }, 16); // ~60fps
    return () => clearInterval(interval);
  }, [selectedStock, targetPositions]);

  const handleJump = () => {
    const current = positions.current[selectedStock];
    positions.current[selectedStock] = { ...current, y: Math.max(0, current.y - 0.2) };
  };

  return (
    <div>
      {Object.keys(positions.current).map(stock => (
        <canvas
          key={stock}
          ref={el => (canvasRefs.current[stock] = el)}
          onTouchStart={(e) => handleStockCardTouch(e, stock)}
          onTouchMove={(e) => handleStockCardTouch(e, stock)}
          onTouchEnd={handleCanvasTouchEnd}
          onMouseDown={(e) => handleStockCardTouch(e, stock)}
          onMouseMove={(e) => touchingRef.current && handleStockCardTouch(e, stock)}
          onMouseUp={handleCanvasTouchEnd}
          style={{ width: '100%', height: '200px', border: '1px solid #ccc', marginBottom: '16px' }}
        />
      ))}

      <button
        onTouchStart={(e) => { e.preventDefault(); handleJump(); }}
        onClick={handleJump}
        style={{ padding: '8px 16px', marginTop: '16px', fontSize: '16px' }}
      >
        Jump
      </button>
    </div>
  );
};

export default WaveStockSurfer;
