from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional

from .. import crud, schemas, database
from ..dependencies import get_current_active_user, get_current_user


router = APIRouter(
    prefix="/api/lessons",
    tags=["lessons"],
)


# Public routes - accessible without authentication
@router.get("/public", response_model=List[schemas.Lesson])
def read_public_lessons(
        skip: int = 0,
        limit: int = 10,
        category_id: Optional[int] = None,
        db: Session = Depends(database.get_db)
):
    """Get a list of public lessons - available to all users without login"""
    if category_id:
        return crud.get_lessons_by_category(db, category_id=category_id)
    return crud.get_lessons(db, skip=skip, limit=limit)


@router.get("/public/{lesson_id}", response_model=schemas.Lesson)
def read_public_lesson(lesson_id: int, db: Session = Depends(database.get_db)):
    """Get details of a specific public lesson"""
    db_lesson = crud.get_lesson(db, lesson_id=lesson_id)
    if db_lesson is None:
        raise HTTPException(status_code=404, detail="Lesson not found")
    return db_lesson


# Protected routes - require authentication
@router.get("/", response_model=List[schemas.Lesson])
def read_lessons(
        skip: int = 0,
        limit: int = 100,
        category_id: Optional[int] = None,
        db: Session = Depends(database.get_db),
        current_user=Depends(get_current_user)
):
    """Get a list of all lessons - requires login"""
    if category_id:
        return crud.get_lessons_by_category(db, category_id=category_id)
    return crud.get_lessons(db, skip=skip, limit=limit)


@router.get("/{lesson_id}", response_model=schemas.Lesson)
def read_lesson(
        lesson_id: int,
        db: Session = Depends(database.get_db),
        current_user=Depends(get_current_user)
):
    """Get details of a specific lesson - requires login"""
    db_lesson = crud.get_lesson(db, lesson_id=lesson_id)
    if db_lesson is None:
        raise HTTPException(status_code=404, detail="Lesson not found")
    return db_lesson


@router.post("/", response_model=schemas.Lesson)
def create_lesson(
        lesson: schemas.LessonCreate,
        db: Session = Depends(database.get_db),
        current_user=Depends(get_current_active_user)
):
    """Create a new lesson - requires login"""
    # In a real application, we want to check if the user has admin privileges
    # For the draft version that will do
    return crud.create_lesson(db=db, lesson=lesson)


@router.post("/{lesson_id}/progress", response_model=schemas.Progress)
def update_lesson_progress(
        lesson_id: int,
        progress: schemas.ProgressCreate,
        db: Session = Depends(database.get_db),
        current_user=Depends(get_current_active_user)
):
    """Update user's progress for a specific lesson"""
    if progress.lesson_id != lesson_id:
        raise HTTPException(status_code=400, detail="Lesson ID mismatch")

    # Check if the lesson exists
    lesson = crud.get_lesson(db, lesson_id=lesson_id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")

    return crud.create_or_update_progress(
        db=db,
        user_id=current_user.id,
        progress=progress
    )


@router.get("/progress/me", response_model=List[schemas.Progress])
def read_my_progress(
        db: Session = Depends(database.get_db),
        current_user=Depends(get_current_active_user)
):
    """Get the current user's progress for all lessons"""
    return crud.get_user_progress(db, user_id=current_user.id)