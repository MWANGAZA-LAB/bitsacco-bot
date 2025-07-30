"""
Minimal test to isolate issues
"""

from fastapi import FastAPI
from fastapi.testclient import TestClient

# Create a minimal app without lifespan
app = FastAPI()


@app.get("/health")
async def health():
    return {"status": "healthy"}


# Test it
client = TestClient(app)
response = client.get("/health")
print(f"Status: {response.status_code}")
print(f"Response: {response.json()}")
