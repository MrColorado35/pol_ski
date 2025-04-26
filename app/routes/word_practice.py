from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any
import random
from datetime import datetime

from .. import schemas, database, models
from ..dependencies import get_current_active_user

router = APIRouter(
    prefix="/words",
    tags=["word_practice"],
)


@router.get("/practice/next", response_model=List[Dict[str, Any]])
def get_practice_exercises(
        exercise_type: str = "multiple_choice",
        limit: int = 5,
        db: Session = Depends(database.get_db),
        current_user=Depends(get_current_active_user)
):
    """Generate practice exercises for the user"""
    try:
        # Get words the user has learned
        word_masteries = db.query(models.WordMastery).filter(
            models.WordMastery.user_id == current_user.id
        ).all()

        # Get IDs of words the user has learned
        learned_word_ids = [wm.word_id for wm in word_masteries]

        # If user hasn't learned any words, get random words
        if not learned_word_ids:
            # Get random words for practice
            practice_words = db.query(models.Word).order_by(
                models.Word.id
            ).limit(limit).all()
        else:
            # Prioritize words the user has learned
            practice_words = db.query(models.Word).filter(
                models.Word.id.in_(learned_word_ids)
            ).order_by(models.Word.id).limit(limit).all()

            # If we don't have enough words, get more random ones
            if len(practice_words) < limit:
                more_words = db.query(models.Word).filter(
                    ~models.Word.id.in_(learned_word_ids)
                ).order_by(models.Word.id).limit(limit - len(practice_words)).all()

                practice_words.extend(more_words)

            random.shuffle(practice_words)

        exercises = []

        if exercise_type == "multiple_choice":
            for word in practice_words:
                # Get distractor options (incorrect choices)
                distractors = db.query(models.Word).filter(
                    models.Word.id != word.id,
                    models.Word.part_of_speech == word.part_of_speech
                ).order_by(models.Word.id).limit(3).all()

                # If we don't have enough distractors, get any words
                if len(distractors) < 3:
                    more_distractors = db.query(models.Word).filter(
                        models.Word.id != word.id
                    ).order_by(models.Word.id).limit(3 - len(distractors)).all()

                    distractors.extend(more_distractors)

                # Create options
                options = [{"id": w.id, "text": w.english} for w in distractors]
                options.append({"id": word.id, "text": word.english})

                random.shuffle(options)

                # Create exercise
                exercises.append({
                    "word_id": word.id,
                    "polish": word.polish,
                    "options": options,
                    "correct_id": word.id
                })

        return exercises

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error generating practice exercises: {str(e)}"
        )


@router.get("/review/due", response_model=List[schemas.Word])
def get_words_due_for_review(
        limit: int = 10,
        db: Session = Depends(database.get_db),
        current_user=Depends(get_current_active_user)
):
    """Get words that are due for review based on spaced repetition schedule"""
    try:
        # Get words due for review
        now = datetime.utcnow()

        # Get word IDs that need review
        word_masteries = db.query(models.WordMastery).filter(
            models.WordMastery.user_id == current_user.id,
            models.WordMastery.next_review <= now
        ).limit(limit).all()

        if not word_masteries:
            # If no words are due, just return recently learned words
            recent_masteries = db.query(models.WordMastery).filter(
                models.WordMastery.user_id == current_user.id
            ).order_by(models.WordMastery.id.desc()).limit(limit).all()

            word_ids = [wm.word_id for wm in recent_masteries]
        else:
            word_ids = [wm.word_id for wm in word_masteries]

        # Get the actual words
        if word_ids:
            words = db.query(models.Word).filter(
                models.Word.id.in_(word_ids)
            ).all()
            return words

        return []

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error getting words for review: {str(e)}"
        )


@router.get("/learn/next", response_model=List[schemas.Word])
def get_next_words_to_learn(
        limit: int = 5,
        db: Session = Depends(database.get_db),
        current_user=Depends(get_current_active_user)
):
    """Get new words for the user to learn based on their current level"""
    try:
        # Get words the user has already studied
        studied_word_ids_query = db.query(models.WordMastery.word_id).filter(
            models.WordMastery.user_id == current_user.id
        )

        studied_word_ids = [w[0] for w in studied_word_ids_query.all()]

        # Get words the user hasn't studied yet, prioritizing by difficulty level
        if studied_word_ids:
            new_words = db.query(models.Word).filter(
                ~models.Word.id.in_(studied_word_ids)
            ).order_by(models.Word.difficulty_level).limit(limit).all()
        else:
            # If user hasn't studied any words, get the easiest ones
            new_words = db.query(models.Word).order_by(
                models.Word.difficulty_level
            ).limit(limit).all()

        return new_words

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error getting new words to learn: {str(e)}"
        )