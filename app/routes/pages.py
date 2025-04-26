from fastapi import APIRouter, Request
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse, RedirectResponse
from pathlib import Path

# Set up templates
templates_dir = Path("app/templates")
templates = Jinja2Templates(directory=str(templates_dir))

router = APIRouter(tags=["pages"])

@router.get("/", response_class=HTMLResponse)
async def index(request: Request):
    """Serve the home page"""
    return templates.TemplateResponse("index.html", {"request": request})

@router.get("/login", response_class=HTMLResponse)
async def login_page(request: Request):
    """Serve the login page"""
    return templates.TemplateResponse("login.html", {"request": request})

@router.get("/register", response_class=HTMLResponse)
async def register_page(request: Request):
    """Serve the registration page"""
    return templates.TemplateResponse("register.html", {"request": request})

@router.get("/lessons", response_class=HTMLResponse)
async def lessons_page(request: Request):
    """Serve the lessons page"""
    return templates.TemplateResponse("lessons.html", {"request": request})

@router.get("/lessons/{lesson_id}", response_class=HTMLResponse)
async def lesson_detail_page(request: Request, lesson_id: int):
    """Serve a specific lesson page"""
    return templates.TemplateResponse(
        "lesson_detail.html",
        {"request": request, "lesson_id": lesson_id}
    )

@router.get("/practice", response_class=HTMLResponse)
async def practice_page(request: Request):
    """Serve the practice page"""
    return templates.TemplateResponse("practice.html", {"request": request})

@router.get("/profile", response_class=HTMLResponse)
async def profile_page(request: Request):
    """Serve the user profile page - requires authentication"""
    return templates.TemplateResponse("profile.html", {"request": request})

@router.get("/progress", response_class=HTMLResponse)
async def progress_page(request: Request): #, token: str = Depends(oauth2_scheme)):
    """Serve the user progress page - requires authentication"""
    return templates.TemplateResponse("progress.html", {"request": request})

@router.get("/about", response_class=HTMLResponse)
async def about_page(request: Request):
    """Serve the about page"""
    return templates.TemplateResponse("about.html", {"request": request})

@router.get("/logout", response_class=HTMLResponse)
async def logout(request: Request):
    """Handle logout by redirecting to home page"""
    response = RedirectResponse(url="/")
    return response

# Add a debug page for development
@router.get("/debug", response_class=HTMLResponse)
async def debug_page(request: Request):
    return templates.TemplateResponse("debug.html", {"request": request})