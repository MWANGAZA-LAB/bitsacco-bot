#!/usr/bin/env python3
"""
Development runner script for Bitsacco WhatsApp Bot
"""

import os
import sys
import asyncio
import subprocess
from pathlib import Path

def check_requirements():
    """Check if all requirements are installed"""
    try:
        import fastapi
        import selenium
        import openai
        import structlog
        import sqlalchemy
        print("✅ All required packages are installed")
        return True
    except ImportError as e:
        print(f"❌ Missing package: {e}")
        print("Run: pip install -r requirements.txt")
        return False

def check_environment():
    """Check environment configuration"""
    env_file = Path(".env")
    if not env_file.exists():
        print("❌ .env file not found")
        print("Copy .env.example to .env and configure your settings")
        return False
    
    print("✅ Environment file found")
    return True

def check_chromedriver():
    """Check if ChromeDriver is available"""
    try:
        result = subprocess.run(
            ["chromedriver", "--version"], 
            capture_output=True, 
            text=True
        )
        if result.returncode == 0:
            print(f"✅ ChromeDriver found: {result.stdout.strip()}")
            return True
    except FileNotFoundError:
        pass
    
    print("❌ ChromeDriver not found")
    print("Download from: https://chromedriver.chromium.org/")
    return False

def run_dev_server():
    """Run the development server"""
    print("🚀 Starting Bitsacco WhatsApp Bot...")
    print("📱 WhatsApp Web will open automatically")
    print("🔍 Health check: http://localhost:8000/health")
    print("📖 API docs: http://localhost:8000/docs")
    print("")
    
    try:
        subprocess.run([
            "uvicorn", 
            "app.main:app",
            "--reload",
            "--host", "0.0.0.0",
            "--port", "8000"
        ])
    except KeyboardInterrupt:
        print("\n👋 Bot stopped")

def run_tests():
    """Run the test suite"""
    print("🧪 Running tests...")
    subprocess.run(["pytest", "-v"])

def main():
    """Main entry point"""
    if len(sys.argv) > 1:
        command = sys.argv[1]
        
        if command == "test":
            run_tests()
            return
        elif command == "check":
            print("🔍 Checking system requirements...")
            all_good = True
            all_good &= check_requirements()
            all_good &= check_environment()
            all_good &= check_chromedriver()
            
            if all_good:
                print("\n✅ All checks passed! Ready to run.")
            else:
                print("\n❌ Some checks failed. Please fix the issues above.")
            return
        elif command == "help":
            print("Bitsacco WhatsApp Bot - Development Commands")
            print("")
            print("python run.py           - Start development server")
            print("python run.py check     - Check system requirements")
            print("python run.py test      - Run test suite")
            print("python run.py help      - Show this help")
            return
    
    # Default: run development server
    print("🔍 Checking system...")
    if not check_requirements():
        return
    if not check_environment():
        return
    
    run_dev_server()

if __name__ == "__main__":
    main()
