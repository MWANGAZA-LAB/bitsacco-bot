/**
 * Simple Voice Configuration Test
 * For Bitsacco WhatsApp Assistant
 */

import dotenv from 'dotenv';

dotenv.config();

function testVoiceConfig(): boolean {
  console.log('🎤 ElevenLabs Simple Configuration Test\n');
  
  const apiKey = process.env.ELEVENLABS_API_KEY;
  
  if (apiKey && apiKey.length > 10) {
    console.log('✅ ElevenLabs API key found');
    console.log(`🔑 Key length: ${apiKey.length} characters`);
    return true;
  } else {
    console.log('❌ ElevenLabs API key not configured');
    console.log('🔧 Add ELEVENLABS_API_KEY=your_key_here to .env file');
    return false;
  }
}

if (require.main === module) {
  const configured = testVoiceConfig();
  process.exit(configured ? 0 : 1);
}

export { testVoiceConfig };
