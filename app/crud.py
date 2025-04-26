from sqlalchemy.orm import Session
from . import models, schemas
from datetime import datetime, timedelta
import random
from passlib.context import CryptContext

# Password context for hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# User operations
def get_user(db: Session, user_id: int):
    return db.query(models.User).filter(models.User.id == user_id).first()


def get_user_by_username(db: Session, username: str):
    return db.query(models.User).filter(models.User.username == username).first()


def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()


def get_users(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.User).offset(skip).limit(limit).all()


def create_user(db: Session, user: schemas.UserCreate):
    hashed_password = pwd_context.hash(user.password)
    db_user = models.User(
        username=user.username,
        email=user.email,
        hashed_password=hashed_password
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)


def authenticate_user(db: Session, username: str, password: str):
    user = get_user_by_username(db, username)
    if not user:
        return False
    if not verify_password(password, user.hashed_password):
        return False
    return user


# Category operations
def get_category(db: Session, category_id: int):
    return db.query(models.Category).filter(models.Category.id == category_id).first()


def get_categories(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Category).offset(skip).limit(limit).all()


def create_category(db: Session, category: schemas.CategoryCreate):
    db_category = models.Category(**category.dict())
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category


# Word operations
def get_word(db: Session, word_id: int):
    return db.query(models.Word).filter(models.Word.id == word_id).first()


def get_words(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Word).offset(skip).limit(limit).all()


def get_words_by_category(db: Session, category_id: int):
    return db.query(models.Word).filter(models.Word.category_id == category_id).all()


def create_word(db: Session, word: schemas.WordCreate):
    db_word = models.Word(**word.dict())
    db.add(db_word)
    db.commit()
    db.refresh(db_word)
    return db_word


# Lesson operations
def get_lesson(db: Session, lesson_id: int):
    return db.query(models.Lesson).filter(models.Lesson.id == lesson_id).first()


def get_lessons(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Lesson).offset(skip).limit(limit).all()


def get_lessons_by_category(db: Session, category_id: int):
    return db.query(models.Lesson).filter(models.Lesson.category_id == category_id).all()


def create_lesson(db: Session, lesson: schemas.LessonCreate):
    # Create the lesson
    lesson_data = lesson.dict(exclude={"word_ids"})
    db_lesson = models.Lesson(**lesson_data)
    db.add(db_lesson)
    db.commit()
    db.refresh(db_lesson)

    # Associate words with the lesson
    for word_id in lesson.word_ids:
        db_lesson_word = models.LessonWord(lesson_id=db_lesson.id, word_id=word_id)
        db.add(db_lesson_word)

    db.commit()
    return db_lesson


# Progress operations
def get_user_progress(db: Session, user_id: int):
    return db.query(models.Progress).filter(models.Progress.user_id == user_id).all()


def get_lesson_progress(db: Session, user_id: int, lesson_id: int):
    return db.query(models.Progress).filter(
        models.Progress.user_id == user_id,
        models.Progress.lesson_id == lesson_id
    ).first()


def create_or_update_progress(db: Session, user_id: int, progress: schemas.ProgressCreate):
    # Check if progress exists
    db_progress = get_lesson_progress(db, user_id, progress.lesson_id)

    if db_progress:
        # Update existing progress
        db_progress.completed = progress.completed
        db_progress.score = progress.score
        db_progress.last_studied = datetime.utcnow()
    else:
        # Create new progress
        db_progress = models.Progress(
            user_id=user_id,
            lesson_id=progress.lesson_id,
            completed=progress.completed,
            score=progress.score,
            last_studied=datetime.utcnow()
        )
        db.add(db_progress)

    db.commit()
    db.refresh(db_progress)
    return db_progress


# Word mastery operations
def get_word_mastery(db: Session, user_id: int, word_id: int):
    return db.query(models.WordMastery).filter(
        models.WordMastery.user_id == user_id,
        models.WordMastery.word_id == word_id
    ).first()


def get_user_word_masteries(db: Session, user_id: int):
    return db.query(models.WordMastery).filter(
        models.WordMastery.user_id == user_id
    ).all()


def create_or_update_word_mastery(db: Session, user_id: int, word_mastery: schemas.WordMasteryCreate):
    db_word_mastery = get_word_mastery(db, user_id, word_mastery.word_id)

    # Calculate next review time based on spaced repetition algorithm
    # Higher mastery level = longer interval between reviews
    intervals = [1, 3, 7, 14, 30, 90]  # Days between reviews for each level
    mastery_level = word_mastery.mastery_level
    review_interval = intervals[min(mastery_level, len(intervals) - 1)]
    next_review = datetime.utcnow() + timedelta(days=review_interval)

    if db_word_mastery:
        # Update existing mastery
        db_word_mastery.mastery_level = mastery_level
        db_word_mastery.next_review = next_review
    else:
        # Create new mastery
        db_word_mastery = models.WordMastery(
            user_id=user_id,
            word_id=word_mastery.word_id,
            mastery_level=mastery_level,
            next_review=next_review
        )
        db.add(db_word_mastery)

    db.commit()
    db.refresh(db_word_mastery)
    return db_word_mastery


# Learning service functions
def get_words_to_review(db: Session, user_id: int, limit: int = 10):
    """Get words that are due for review based on spaced repetition schedule"""
    now = datetime.utcnow()

    # Get word IDs that need review
    word_masteries = db.query(models.WordMastery).filter(
        models.WordMastery.user_id == user_id,
        models.WordMastery.next_review <= now
    ).limit(limit).all()

    word_ids = [wm.word_id for wm in word_masteries]

    # Get the actual words
    if word_ids:
        return db.query(models.Word).filter(models.Word.id.in_(word_ids)).all()
    return []


def get_next_words_to_learn(db: Session, user_id: int, limit: int = 5):
    """Get new words for the user to learn based on their current level"""
    # Get words the user has already studied
    studied_word_ids = db.query(models.WordMastery.word_id).filter(
        models.WordMastery.user_id == user_id
    ).all()
    studied_word_ids = [w[0] for w in studied_word_ids]

    # Get words the user hasn't studied yet, prioritizing by difficulty level
    new_words = db.query(models.Word).filter(
        ~models.Word.id.in_(studied_word_ids) if studied_word_ids else True
    ).order_by(models.Word.difficulty_level).limit(limit).all()

    return new_words


def generate_practice_exercise(db: Session, user_id: int, exercise_type: str = "multiple_choice"):
    """Generate a practice exercise for the user"""
    words_to_review = get_words_to_review(db, user_id, limit=3)
    new_words = get_next_words_to_learn(db, user_id, limit=2)

    practice_words = words_to_review + new_words

    if not practice_words:
        practice_words = db.query(models.Word).order_by(models.Word.id).limit(5).all()

    # Shuffle the words
    random.shuffle(practice_words)

    if exercise_type == "multiple_choice":
        exercises = []
        for word in practice_words:
            # Get distractor options (incorrect choices)
            distractors = db.query(models.Word).filter(
                models.Word.id != word.id,
                models.Word.part_of_speech == word.part_of_speech
            ).order_by(models.Word.id).limit(3).all()

            options = [{"id": w.id, "text": w.english} for w in distractors]
            options.append({"id": word.id, "text": word.english})
            random.shuffle(options)

            exercises.append({
                "word_id": word.id,
                "polish": word.polish,
                "options": options,
                "correct_id": word.id
            })

        return exercises

    return practice_words