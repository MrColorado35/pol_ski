from sqlalchemy import Column, Integer, String, ForeignKey, Text
from sqlalchemy.orm import relationship

from ..database import Base


class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    description = Column(String)

    words = relationship("Word", back_populates="category")
    lessons = relationship("Lesson", back_populates="category")


class Word(Base):
    __tablename__ = "words"

    id = Column(Integer, primary_key=True, index=True)
    polish = Column(String, index=True)
    english = Column(String, index=True)
    part_of_speech = Column(String)  # noun, verb, adjective, etc.
    pronunciation = Column(String)  # Simplified pronunciation guide
    difficulty_level = Column(Integer, default=1)  # 1-5 scale
    category_id = Column(Integer, ForeignKey("categories.id"))

    category = relationship("Category", back_populates="words")
    lesson_words = relationship("LessonWord", back_populates="word")


class Lesson(Base):
    __tablename__ = "lessons"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    description = Column(Text)
    difficulty_level = Column(Integer, default=1)
    order_number = Column(Integer)
    category_id = Column(Integer, ForeignKey("categories.id"))

    category = relationship("Category", back_populates="lessons")
    lesson_words = relationship("LessonWord", back_populates="lesson")


class LessonWord(Base):
    __tablename__ = "lesson_words"

    id = Column(Integer, primary_key=True, index=True)
    lesson_id = Column(Integer, ForeignKey("lessons.id"))
    word_id = Column(Integer, ForeignKey("words.id"))

    lesson = relationship("Lesson", back_populates="lesson_words")
    word = relationship("Word", back_populates="lesson_words")