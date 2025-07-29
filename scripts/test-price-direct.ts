/**
 * Direct Bitcoin Price Test Script
 * Simple test for CoinGecko API integration
 * For Bitsacco WhatsApp Assistant
 */

import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

interface CoinGeckoResponse {
  bitcoin: {
    usd: number;
    usd_24h_change: number;
    kes: number;
    kes_24h_change: number;
  };
}

async function testPriceDirect(): Promise<void> {
  console.log('🔍 Direct Bitcoin Price Test\n');

  try {
    const apiKey = process.env.COINGECKO_API_KEY;
    const url = 'https://api.coingecko.com/api/v3/simple/price';
    
    const params = {
      ids: 'bitcoin',
      vs_currencies: 'usd,kes',
      include_24hr_change: 'true'
    };

    const headers = apiKey ? { 'x-cg-demo-api-key': apiKey } : {};

    console.log(`📡 API URL: ${url}`);
    console.log(`🔑 Using API Key: ${apiKey ? 'Yes' : 'No'}`);
    console.log(`📊 Parameters:`, params);

    const startTime = Date.now();
    const response = await axios.get<CoinGeckoResponse>(url, { 
      params, 
      headers,
      timeout: 10000 
    });
    const endTime = Date.now();

    console.log(`\n⚡ Response Time: ${endTime - startTime}ms`);
    console.log(`📈 Status: ${response.status} ${response.statusText}`);

    const data = response.data;
    const bitcoin = data.bitcoin;

    console.log('\n💰 Current Bitcoin Prices:');
    console.log(`USD: $${bitcoin.usd.toLocaleString()}`);
    console.log(`KES: KSH ${bitcoin.kes.toLocaleString()}`);
    console.log(`24h Change (USD): ${bitcoin.usd_24h_change >= 0 ? '+' : ''}${bitcoin.usd_24h_change.toFixed(2)}%`);
    console.log(`24h Change (KES): ${bitcoin.kes_24h_change >= 0 ? '+' : ''}${bitcoin.kes_24h_change.toFixed(2)}%`);

    // Test rate limiting
    console.log('\n🚦 Testing rate limits...');
    const rateLimitTest = await Promise.allSettled([
      axios.get(url, { params, headers, timeout: 5000 }),
      axios.get(url, { params, headers, timeout: 5000 }),
      axios.get(url, { params, headers, timeout: 5000 })
    ]);

    const successful = rateLimitTest.filter(r => r.status === 'fulfilled').length;
    console.log(`✅ Rate limit test: ${successful}/3 requests successful`);

    console.log('\n🎯 Direct price test completed successfully!');

  } catch (error) {
    console.error('\n❌ Direct price test failed:');
    
    if (axios.isAxiosError(error)) {
      console.error(`Status: ${error.response?.status}`);
      console.error(`Message: ${error.message}`);
      console.error(`Headers:`, error.response?.headers);
      
      if (error.response?.status === 429) {
        console.error('⚠️  Rate limit exceeded. Consider using API key or waiting.');
      }
    } else {
      console.error(error);
    }
    
    throw error;
  }
}

if (require.main === module) {
  testPriceDirect()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export { testPriceDirect };
