from sqlalchemy import Column, Integer, Float, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime

from ..database import Base


class Progress(Base):
    __tablename__ = "progress"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    lesson_id = Column(Integer, ForeignKey("lessons.id"))
    completed = Column(Boolean, default=False)
    score = Column(Float, default=0.0)  # Percentage correct
    last_studied = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="progress")
    lesson = relationship("Lesson")


class WordMastery(Base):
    __tablename__ = "word_mastery"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    word_id = Column(Integer, ForeignKey("words.id"))
    mastery_level = Column(Integer, default=0)  # 0-5 scale
    next_review = Column(DateTime)  # For spaced repetition

    user = relationship("User")
    word = relationship("Word")