#!/usr/bin/env node

/**
 * ElevenLabs Integration Test Script
 * Tests the voice synthesis functionality with your API key
 */

import { typedVoiceSynthesizer } from '../src/services/voiceSynthesizer.ts';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

async function testElevenLabsIntegration() {
  console.log('🔊 Testing ElevenLabs Integration...\n');

  try {
    // Test 1: Basic synthesis
    console.log('📝 Test 1: Basic Text Synthesis');
    const testText = 'Hello! Welcome to Bitsacco. Your Bitcoin journey starts here.';
    
    console.log(`Testing text: "${testText}"`);
    const result = await typedVoiceSynthesizer.synthesize(testText, {
      voice: 'default',
      speed: 1.0,
      pitch: 1.0
    });

    if (result.success && result.audioPath) {
      console.log('✅ Text synthesis successful!');
      console.log(`   Audio saved to: ${result.audioPath}`);
      console.log(`   File size: ${result.fileSizeBytes} bytes`);
      console.log(`   Duration: ${result.durationSeconds}s`);
    } else {
      console.log('❌ Text synthesis failed:', result.error);
      return;
    }

    // Test 2: Voice listing
    console.log('\n📋 Test 2: Available Voices');
    const voices = await typedVoiceSynthesizer.getAvailableVoices();
    
    if (voices.success && voices.voices) {
      console.log('✅ Voice listing successful!');
      console.log(`   Found ${voices.voices.length} voices:`);
      voices.voices.slice(0, 5).forEach(voice => {
        console.log(`   - ${voice.name} (${voice.id})`);
      });
      if (voices.voices.length > 5) {
        console.log(`   ... and ${voices.voices.length - 5} more`);
      }
    } else {
      console.log('⚠️ Voice listing failed:', voices.error);
    }

    // Test 3: Long text handling
    console.log('\n📄 Test 3: Long Text Handling');
    const longText = `
      Bitcoin is a revolutionary digital currency that operates on a peer-to-peer network.
      With Bitsacco, you can easily save, withdraw, and manage your Bitcoin investments.
      Our platform provides secure storage, real-time price tracking, and educational resources
      to help you make informed decisions about your Bitcoin savings.
      Join thousands of satisfied users who trust Bitsacco for their Bitcoin needs.
    `.trim();

    console.log(`Testing long text (${longText.length} characters)`);
    const longResult = await typedVoiceSynthesizer.synthesize(longText, {
      voice: 'default',
      speed: 1.1,
      pitch: 0.9
    });

    if (longResult.success && longResult.audioPath) {
      console.log('✅ Long text synthesis successful!');
      console.log(`   Audio saved to: ${longResult.audioPath}`);
      console.log(`   File size: ${longResult.fileSizeBytes} bytes`);
      console.log(`   Duration: ${longResult.durationSeconds}s`);
    } else {
      console.log('❌ Long text synthesis failed:', longResult.error);
    }

    // Test 4: Cache functionality
    console.log('\n💾 Test 4: Cache Functionality');
    console.log('Re-synthesizing the same text to test caching...');
    
    const cachedResult = await typedVoiceSynthesizer.synthesize(testText, {
      voice: 'default',
      speed: 1.0,
      pitch: 1.0
    });

    if (cachedResult.success) {
      if (cachedResult.cached) {
        console.log('✅ Cache working correctly - audio served from cache');
      } else {
        console.log('ℹ️ Audio regenerated (cache may be disabled or expired)');
      }
    }

    // Test 5: Statistics
    console.log('\n📊 Test 5: Service Statistics');
    const stats = typedVoiceSynthesizer.getStats();
    console.log('Service Statistics:');
    console.log(`   Total requests: ${stats.totalRequests}`);
    console.log(`   Successful: ${stats.successfulRequests}`);
    console.log(`   Failed: ${stats.failedRequests}`);
    console.log(`   Cache hits: ${stats.cacheHits}`);
    console.log(`   Average processing time: ${stats.averageProcessingTime}ms`);

    console.log('\n🎉 ElevenLabs integration test completed successfully!');

    // Clean up test files
    console.log('\n🧹 Cleaning up test files...');
    await typedVoiceSynthesizer.cleanupOldFiles();
    console.log('✅ Cleanup completed');

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    
    if (error.message.includes('401') || error.message.includes('unauthorized')) {
      console.log('\n💡 Troubleshooting Tips:');
      console.log('   1. Check your ElevenLabs API key in .env file');
      console.log('   2. Ensure the API key has Text-to-Speech permissions');
      console.log('   3. Verify you have sufficient credits in your ElevenLabs account');
    }
  }
}

// Check environment variables
function checkEnvironment() {
  console.log('🔍 Checking Environment Configuration...\n');
  
  const requiredVars = [
    'ELEVENLABS_API_KEY',
    'ELEVENLABS_VOICE_ID',
    'ELEVENLABS_MODEL_ID'
  ];

  let allPresent = true;
  requiredVars.forEach(varName => {
    const value = process.env[varName];
    if (value && value !== 'your_elevenlabs_api_key_here') {
      console.log(`✅ ${varName}: ${value.substring(0, 10)}...`);
    } else {
      console.log(`❌ ${varName}: Missing or not configured`);
      allPresent = false;
    }
  });

  if (!allPresent) {
    console.log('\n❌ Please configure missing environment variables in .env file');
    process.exit(1);
  }

  console.log('✅ Environment configuration looks good!\n');
}

// Main execution
async function main() {
  console.log('🎤 Bitsacco ElevenLabs Integration Test\n');
  console.log('This script will test the voice synthesis functionality.\n');
  
  checkEnvironment();
  await testElevenLabsIntegration();
}

// Handle errors gracefully
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run the test
main().catch(console.error);
