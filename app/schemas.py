from typing import List, Optional
from pydantic import BaseModel, EmailStr
from datetime import datetime

# User schemas
class UserBase(BaseModel):
    username: str
    email: EmailStr

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    is_active: bool

    class Config:
        orm_mode = True

# Token schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

# Word schemas
class WordBase(BaseModel):
    polish: str
    english: str
    part_of_speech: str
    pronunciation: str
    difficulty_level: int = 1

class WordCreate(WordBase):
    category_id: int

class Word(WordBase):
    id: int
    category_id: int

    class Config:
        orm_mode = True

# Category schemas
class CategoryBase(BaseModel):
    name: str
    description: str

class CategoryCreate(CategoryBase):
    pass

class Category(CategoryBase):
    id: int
    words: List[Word] = []

    class Config:
        orm_mode = True

# Lesson schemas
class LessonBase(BaseModel):
    title: str
    description: str
    difficulty_level: int = 1
    order_number: int

class LessonCreate(LessonBase):
    category_id: int
    word_ids: List[int]

class Lesson(LessonBase):
    id: int
    category_id: int

    class Config:
        orm_mode = True

# Progress schemas
class ProgressBase(BaseModel):
    completed: bool = False
    score: float = 0.0

class ProgressCreate(ProgressBase):
    lesson_id: int

class Progress(ProgressBase):
    id: int
    user_id: int
    lesson_id: int
    last_studied: datetime

    class Config:
        orm_mode = True

# Word Mastery schemas
class WordMasteryBase(BaseModel):
    mastery_level: int = 0

class WordMasteryCreate(WordMasteryBase):
    word_id: int

class WordMastery(WordMasteryBase):
    id: int
    user_id: int
    word_id: int
    next_review: Optional[datetime]

    class Config:
        orm_mode = True