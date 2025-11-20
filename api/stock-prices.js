// FILE: api/stock-prices.js
import { kv } from '@vercel/kv';

export const config = {
  runtime: 'edge', // Fast edge runtime
};

// Crypto mapping
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

async function fetchPriceFromFinnhub(symbol) {
  try {
    const response = await fetch(
      `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=d49emh9r01qshn3lui9gd49emh9r01qshn3luia0`
    );
    
    if (!response.ok) return null;
    
    const data = await response.json();
    if (data.c && data.c > 0) {
      return {
        price: data.c,
        change: {
          amount: data.d || 0,
          percent: data.dp || 0
        }
      };
    }
  } catch (error) {
    console.error(`Finnhub error for ${symbol}:`, error);
  }
  return null;
}

async function fetchPriceFromAlphaVantage(symbol) {
  try {
    const response = await fetch(
      `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=UAL2SCJ3884W7O2E`
    );
    
    if (!response.ok) return null;
    
    const data = await response.json();
    const quote = data['Global Quote'];
    
    if (quote && quote['05. price']) {
      return {
        price: parseFloat(quote['05. price']),
        change: {
          amount: parseFloat(quote['09. change'] || 0),
          percent: parseFloat(quote['10. change percent']?.replace('%', '') || 0)
        }
      };
    }
  } catch (error) {
    console.error(`Alpha Vantage error for ${symbol}:`, error);
  }
  return null;
}

export default async function handler(request) {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  // Handle OPTIONS request for CORS
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers });
  }

  const { searchParams } = new URL(request.url);
  const symbols = searchParams.get('symbols');

  if (!symbols) {
    return new Response(
      JSON.stringify({ error: 'No symbols provided' }),
      { status: 400, headers }
    );
  }

  const symbolList = symbols.split(',').map(s => s.trim().toUpperCase());
  const results = {};
  const CACHE_DURATION = 60; // 60 seconds

  for (const symbol of symbolList) {
    try {
      // Check cache first
      const cacheKey = `price:${symbol}`;
      const cached = await kv.get(cacheKey);

      if (cached) {
        results[symbol] = cached;
        continue;
      }

      // Determine which API symbol to use
      const apiSymbol = cryptoMap[symbol] || symbol;
      
      // Fetch fresh data
      let priceData = await fetchPriceFromFinnhub(apiSymbol);
      
      // Fallback to Alpha Vantage if Finnhub fails (stocks only)
      if (!priceData && !cryptoMap[symbol]) {
        await new Promise(resolve => setTimeout(resolve, 200)); // Rate limit delay
        priceData = await fetchPriceFromAlphaVantage(symbol);
      }

      if (priceData) {
        const result = {
          ...priceData,
          timestamp: Date.now()
        };

        // Cache for 60 seconds
        await kv.set(cacheKey, result, { ex: CACHE_DURATION });
        results[symbol] = result;
      } else {
        results[symbol] = {
          error: 'Unable to fetch price',
          timestamp: Date.now()
        };
      }

      // Small delay between stocks to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 250));
      
    } catch (error) {
      console.error(`Error processing ${symbol}:`, error);
      results[symbol] = {
        error: error.message,
        timestamp: Date.now()
      };
    }
  }

  return new Response(JSON.stringify(results), { status: 200, headers });
}