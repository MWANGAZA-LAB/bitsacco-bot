#!/usr/bin/env python3
"""
Simple test script to debug API issues
"""

import asyncio
import sys
from fastapi.testclient import TestClient


def test_basic_import():
    """Test if we can import the main app"""
    try:
        from app.main import create_app

        print("✅ Successfully imported create_app")
        return True
    except Exception as e:
        print(f"❌ Failed to import: {e}")
        return False


def test_app_creation():
    """Test if we can create the FastAPI app"""
    try:
        from app.main import create_app

        app = create_app()
        print("✅ Successfully created FastAPI app")
        return app
    except Exception as e:
        print(f"❌ Failed to create app: {e}")
        return None


def test_health_endpoint(app):
    """Test the health endpoint"""
    try:
        client = TestClient(app)
        response = client.get("/health")
        print(f"✅ Health endpoint status: {response.status_code}")
        if response.status_code == 200:
            print(f"✅ Health response: {response.json()}")
            return True
        else:
            print(f"❌ Health endpoint failed: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Health test failed: {e}")
        return False


def main():
    """Run all tests"""
    print("🔍 Running diagnostic tests...")

    # Test 1: Import
    if not test_basic_import():
        sys.exit(1)

    # Test 2: App creation
    app = test_app_creation()
    if app is None:
        sys.exit(1)

    # Test 3: Health endpoint
    if not test_health_endpoint(app):
        sys.exit(1)

    print("🎉 All diagnostic tests passed!")


if __name__ == "__main__":
    main()
