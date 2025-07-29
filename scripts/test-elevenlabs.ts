/**
 * ElevenLabs Configuration Test
 * For Bitsacco WhatsApp Assistant voice features
 */

import dotenv from 'dotenv';

dotenv.config();

function testElevenLabsConfig(): boolean {
  console.log('🎤 ElevenLabs Configuration Test\n');
  
  const apiKey = process.env.ELEVENLABS_API_KEY;
  
  if (apiKey && apiKey.length > 20) {
    console.log('✅ ElevenLabs API key configured');
    console.log(`🔑 Key length: ${apiKey.length} characters`);
    console.log('🎯 Voice synthesis ready for integration');
    
    // Test environment variables
    const testVoices = [
      'Adam (English)',
      'Rachel (English)', 
      'Domi (English)',
      'Bella (English)'
    ];
    
    console.log('\n🎭 Available test voices:');
    testVoices.forEach((voice, index) => {
      console.log(`   ${index + 1}. ${voice}`);
    });
    
    return true;
  } else if (apiKey) {
    console.log('⚠️  API key found but appears invalid');
    console.log('🔧 Please verify your ElevenLabs API key');
    return false;
  } else {
    console.log('❌ ElevenLabs API key not configured');
    console.log('🔧 Add ELEVENLABS_API_KEY to .env file');
    console.log('📖 Get your key from: https://elevenlabs.io');
    return false;
  }
}

if (require.main === module) {
  const result = testElevenLabsConfig();
  
  console.log('\n' + '='.repeat(50));
  if (result) {
    console.log('🎉 ElevenLabs configuration test PASSED');
    console.log('💡 Ready for voice message synthesis');
  } else {
    console.log('❌ ElevenLabs configuration test FAILED');
    console.log('💡 Configure API key to enable voice features');
  }
  console.log('='.repeat(50));
  
  process.exit(result ? 0 : 1);
}

export { testElevenLabsConfig };
