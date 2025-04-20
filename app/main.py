from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
import os
from pathlib import Path

from . import models
from .database import engine
from .routes import auth, users, lessons, words
from .config import APP_NAME, APP_DESCRIPTION, APP_VERSION

models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=APP_NAME,
    description=APP_DESCRIPTION,
    version=APP_VERSION,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


static_dir = Path("app/static")
templates_dir = Path("app/templates")
static_dir.mkdir(exist_ok=True)
templates_dir.mkdir(exist_ok=True)

app.mount("/static", StaticFiles(directory=str(static_dir)), name="static")
templates = Jinja2Templates(directory=str(templates_dir))

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(lessons.router)
app.include_router(words.router)

from .routes import pages, lesson_words, categories
app.include_router(pages.router)
app.include_router(lesson_words.router)
app.include_router(categories.router)

@app.get("/")
async def root():
    return {
        "message": f"Welcome to {APP_NAME}! Learn practical Polish without the complexity.",
        "version": APP_VERSION,
        "docs_url": "/docs",
    }

@app.get("/health")
async def health_check():
    return {"status": "OK"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)