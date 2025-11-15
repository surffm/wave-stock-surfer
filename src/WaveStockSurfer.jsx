useEffect(() => {
    const tubeInterval = setInterval(() => {
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
        
        let waveY = normalizePrice(price);
        const waveMotion = Math.sin(surferPos.x * Math.PI * 4 - timeRef.current * 0.06) * 8;
        waveY += waveMotion;
        
        const verticalOffset = (surferPos.y - 0.5) * height * 0.8;
        const surferY = waveY + verticalOffset;
        
        // Find crest position - more accurate with more samples
        let crestX = 0;
        let highestY = height;
        let crestY = height;
        for (let i = 0; i < 100; i++) {
          const progress = i / 100;
          const hIndex = progress * (history.length - 1);
          const idx = Math.floor(hIndex);
          const nextIdx = Math.min(idx + 1, history.length - 1);
          const t = hIndex - idx;
          const p = history[idx] * (1 - t) + history[nextIdx] * t;
          let y = normalizePrice(p);
          const wm = Math.sin(progress * Math.PI * 4 - timeRef.current * 0.06) * 8;
          y += wm;
          if (y < highestY) {
            highestY = y;
            crestY = y;
            crestX = progress;
          }
        }
        
        // MUCH MORE GENEROUS tube zone - wider X range and deeper Y range
        // Tube extends from before crest to well after it
        const tubeStartX = crestX - 0.05; // Start a bit before crest
        const tubeEndX = crestX + 0.25; // Extended further past crest
        const isInTubeXRange = surferPos.x >= tubeStartX && surferPos.x <= tubeEndX;
        
        // More generous vertical range - anywhere from crest down to much deeper
        const tubeTopY = crestY - 20; // Give some buffer above crest
        const tubeBottomY = crestY + height * 0.5; // Go much deeper
        const isInTubeYRange = surferY >= tubeTopY && surferY <= tubeBottomY;
        
        const isInTube = isInTubeXRange && isInTubeYRange;
        
        setTubeStatus(prev => {
          const current = prev[stock.symbol];
          if (isInTube && !current.inTube) {
            // Entering tube
            return {
              ...prev,
              [stock.symbol]: { inTube: true, tubePoints: 1 }
            };
          } else if (isInTube && current.inTube) {
            // Still in tube, increment points more frequently
            return {
              ...prev,
              [stock.symbol]: { 
                inTube: true, 
                tubePoints: Math.min(current.tubePoints + Math.floor(Math.random() * 150) + 50, 100000)
              }
            };
          } else if (!isInTube && current.inTube) {
            // Exiting tube - add to score
            setScore(s => s + current.tubePoints);
            return {
              ...prev,
              [stock.symbol]: { inTube: false, tubePoints: 0 }
            };
          }
          return prev;
        });
      });
    }, 50); // Check more frequently (50ms instead of 100ms)
    
    return () => clearInterval(tubeInterval);
  }, [stocks, surferPositions]);