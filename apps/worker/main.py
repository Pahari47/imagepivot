import os
from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def read_root():
    return {"status": "Worker is running", "port": os.getenv("PORT", "8000")}

@app.get("/health")
def health_check():
    return {"status": "healthy"}