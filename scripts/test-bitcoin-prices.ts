/**
 * Bitcoin Price Testing Script
 * Tests Bitcoin price fetching from CoinGecko API
 * For Bitsacco WhatsApp Assistant
 */

import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

interface BitcoinPriceResponse {
  bitcoin: {
    usd: number;
    usd_24h_change: number;
    kes: number;
    kes_24h_change: number;
  };
}

interface PriceData {
  usd: {
    price: number;
    change_24h: number;
  };
  kes: {
    price: number;
    change_24h: number;
  };
  timestamp: string;
}

async function testBitcoinPrices(): Promise<void> {
  console.log('🚀 Testing Bitcoin Price Fetching...\n');

  try {
    const url = 'https://api.coingecko.com/api/v3/simple/price';
    const params = {
      ids: 'bitcoin',
      vs_currencies: 'usd,kes',
      include_24hr_change: 'true'
    };

    console.log('📡 Fetching from CoinGecko API...');
    console.log(`URL: ${url}`);
    console.log(`Params:`, params);

    const response = await axios.get<BitcoinPriceResponse>(url, { params });
    
    if (response.status !== 200) {
      throw new Error(`API returned status ${response.status}`);
    }

    const data = response.data;
    console.log('\n✅ Raw API Response:');
    console.log(JSON.stringify(data, null, 2));

    const bitcoin = data.bitcoin;
    
    const priceData: PriceData = {
      usd: {
        price: bitcoin.usd,
        change_24h: bitcoin.usd_24h_change || 0
      },
      kes: {
        price: bitcoin.kes,
        change_24h: bitcoin.kes_24h_change || 0
      },
      timestamp: new Date().toISOString()
    };

    console.log('\n📊 Formatted Price Data:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`💰 Bitcoin Price (USD): $${priceData.usd.price.toLocaleString()}`);
    console.log(`📈 24h Change (USD): ${priceData.usd.change_24h >= 0 ? '+' : ''}${priceData.usd.change_24h.toFixed(2)}%`);
    console.log(`💰 Bitcoin Price (KES): KSH ${priceData.kes.price.toLocaleString()}`);
    console.log(`📈 24h Change (KES): ${priceData.kes.change_24h >= 0 ? '+' : ''}${priceData.kes.change_24h.toFixed(2)}%`);
    console.log(`⏰ Timestamp: ${priceData.timestamp}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Test WhatsApp formatting
    const changeEmoji = priceData.usd.change_24h >= 0 ? '📈' : '📉';
    const whatsappMessage = `
🪙 *Bitcoin Price Update*

💵 *USD:* $${priceData.usd.price.toLocaleString()}
${changeEmoji} *24h Change:* ${priceData.usd.change_24h >= 0 ? '+' : ''}${priceData.usd.change_24h.toFixed(2)}%

🇰🇪 *KES:* KSH ${priceData.kes.price.toLocaleString()}
${changeEmoji} *24h Change:* ${priceData.kes.change_24h >= 0 ? '+' : ''}${priceData.kes.change_24h.toFixed(2)}%

⏰ Updated: ${new Date().toLocaleTimeString()}
`.trim();

    console.log('\n📱 WhatsApp Formatted Message:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(whatsappMessage);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    console.log('\n✅ Bitcoin price test completed successfully!');

  } catch (error) {
    console.error('\n❌ Bitcoin price test failed:');
    if (axios.isAxiosError(error)) {
      console.error(`HTTP Error: ${error.response?.status} - ${error.response?.statusText}`);
      console.error(`Response:`, error.response?.data);
    } else {
      console.error(error);
    }
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  testBitcoinPrices()
    .then(() => {
      console.log('\n🎉 Test completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Test failed:', error);
      process.exit(1);
    });
}

export { testBitcoinPrices };
