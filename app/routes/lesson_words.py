from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from .. import crud, schemas, database, models
from ..dependencies import get_current_user

router = APIRouter(
    prefix="/api/lessons",
    tags=["lesson_words"],
)


@router.get("/{lesson_id:int}/words", response_model=List[schemas.Word])
def get_lesson_words(
        lesson_id: int,
        db: Session = Depends(database.get_db),
        current_user=Depends(get_current_user)
):
    """Get all words for a specific lesson"""
    # Get the lesson to check if it exists
    lesson = crud.get_lesson(db, lesson_id=lesson_id)
    if lesson is None:
        raise HTTPException(status_code=404, detail="Lesson not found")

    # Get lesson word associations
    lesson_words = db.query(models.LessonWord).filter(
        models.LessonWord.lesson_id == lesson_id
    ).all()

    if not lesson_words:
        return []

    # Get the actual word objects
    word_ids = [lw.word_id for lw in lesson_words]
    words = db.query(models.Word).filter(
        models.Word.id.in_(word_ids)
    ).all()

    return words


@router.get("/public/{lesson_id}/words", response_model=List[schemas.Word])
def get_public_lesson_words(
        lesson_id: int,
        db: Session = Depends(database.get_db)
):
    """Get words for a public lesson - no authentication required"""
    # Get the lesson to check if it exists
    lesson = crud.get_lesson(db, lesson_id=lesson_id)
    if lesson is None:
        raise HTTPException(status_code=404, detail="Lesson not found")

    # Get lesson word associations
    lesson_words = db.query(models.LessonWord).filter(
        models.LessonWord.lesson_id == lesson_id
    ).all()

    if not lesson_words:
        return []

    # Get the actual word objects
    word_ids = [lw.word_id for lw in lesson_words]
    words = db.query(models.Word).filter(
        models.Word.id.in_(word_ids)
    ).all()

    return words