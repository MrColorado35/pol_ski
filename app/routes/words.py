from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any

from .. import crud, schemas, database
from ..dependencies import get_current_active_user, get_current_user

router = APIRouter(
    prefix="/api/words",
    tags=["words"],
)


# Public routes
@router.get("/public", response_model=List[schemas.Word])
def read_public_words(
        skip: int = 0,
        limit: int = 20,
        category_id: Optional[int] = None,
        db: Session = Depends(database.get_db)
):
    """Get a sample of words - available without login"""
    if category_id:
        words = crud.get_words_by_category(db, category_id=category_id)
        return words[:limit]  # Simple limit
    return crud.get_words(db, skip=skip, limit=limit)


# Protected routes
@router.get("/", response_model=List[schemas.Word])
def read_words(
        skip: int = 0,
        limit: int = 100,
        category_id: Optional[int] = None,
        db: Session = Depends(database.get_db),
        current_user=Depends(get_current_user)
):
    """Get all words - requires login"""
    if category_id:
        return crud.get_words_by_category(db, category_id=category_id)
    return crud.get_words(db, skip=skip, limit=limit)


@router.post("/", response_model=schemas.Word)
def create_word(
        word: schemas.WordCreate,
        db: Session = Depends(database.get_db),
        current_user=Depends(get_current_active_user)
):
    """Add a new word - requires login"""
    # In a real app, check if user has admin rights
    return crud.create_word(db=db, word=word)


@router.get("/{word_id}", response_model=schemas.Word)
def read_word(
        word_id: int,
        db: Session = Depends(database.get_db),
        current_user=Depends(get_current_user)
):
    """Get details of a specific word"""
    db_word = crud.get_word(db, word_id=word_id)
    if db_word is None:
        raise HTTPException(status_code=404, detail="Word not found")
    return db_word


@router.post("/mastery", response_model=schemas.WordMastery)
def update_word_mastery(
        word_mastery: schemas.WordMasteryCreate,
        db: Session = Depends(database.get_db),
        current_user=Depends(get_current_active_user)
):
    """Update mastery level for a word"""
    # Check if the word exists
    word = crud.get_word(db, word_id=word_mastery.word_id)
    if not word:
        raise HTTPException(status_code=404, detail="Word not found")

    return crud.create_or_update_word_mastery(
        db=db,
        user_id=current_user.id,
        word_mastery=word_mastery
    )


@router.get("/mastery/me", response_model=List[schemas.WordMastery])
def read_my_word_masteries(
        db: Session = Depends(database.get_db),
        current_user=Depends(get_current_active_user)
):
    """Get the current user's mastery levels for all words"""
    return crud.get_user_word_masteries(db, user_id=current_user.id)


# Practice routes
@router.get("/practice/next", response_model=List[Dict[str, Any]])
def get_practice_exercise(
        exercise_type: str = "multiple_choice",
        db: Session = Depends(database.get_db),
        current_user=Depends(get_current_active_user)
):
    """Generate a practice exercise for the user"""
    exercises = crud.generate_practice_exercise(
        db=db,
        user_id=current_user.id,
        exercise_type=exercise_type
    )

    if not exercises:
        raise HTTPException(
            status_code=404,
            detail="No suitable practice exercises found"
        )

    return exercises


@router.get("/review/due", response_model=List[schemas.Word])
def get_words_due_for_review(
        limit: int = 10,
        db: Session = Depends(database.get_db),
        current_user=Depends(get_current_active_user)
):
    """Get words that are due for review based on spaced repetition schedule"""
    words = crud.get_words_to_review(db, user_id=current_user.id, limit=limit)
    return words


@router.get("/learn/next", response_model=List[schemas.Word])
def get_next_words_to_learn(
        limit: int = 5,
        db: Session = Depends(database.get_db),
        current_user=Depends(get_current_active_user)
):
    """Get next batch of words for the user to learn"""
    words = crud.get_next_words_to_learn(db, user_id=current_user.id, limit=limit)
    return words