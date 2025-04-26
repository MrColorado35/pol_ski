from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from .. import crud, schemas, database
from ..dependencies import get_current_active_user

router = APIRouter(
    prefix="/api",
    tags=["user_progress"],
)

@router.get("/lessons/progress/me", response_model=List[schemas.Progress])
def read_my_progress(
    db: Session = Depends(database.get_db),
    current_user = Depends(get_current_active_user)
):
    """Get the current user's progress for all lessons"""
    return crud.get_user_progress(db, user_id=current_user.id)

@router.get("/words/mastery/me", response_model=List[schemas.WordMastery])
def read_my_word_masteries(
    db: Session = Depends(database.get_db),
    current_user = Depends(get_current_active_user)
):
    """Get the current user's mastery levels for all words"""
    return crud.get_user_word_masteries(db, user_id=current_user.id)