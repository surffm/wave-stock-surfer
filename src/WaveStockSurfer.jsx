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