from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from .. import crud, schemas, database
from ..dependencies import get_current_user

router = APIRouter(
    prefix="/api/categories",
    tags=["categories"],
)

@router.get("/", response_model=List[schemas.Category])
def read_categories(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(database.get_db)
):
    return crud.get_categories(db, skip=skip, limit=limit)

@router.get("/{category_id}", response_model=schemas.Category)
def read_category(
    category_id: int,
    db: Session = Depends(database.get_db)
):
    """Get a specific category by ID"""
    db_category = crud.get_category(db, category_id=category_id)
    if db_category is None:
        raise HTTPException(status_code=404, detail="Category not found")
    return db_category

@router.post("/", response_model=schemas.Category)
def create_category(
    category: schemas.CategoryCreate,
    db: Session = Depends(database.get_db),
    current_user = Depends(get_current_user)
):
    """Create a new category - requires authentication"""
    return crud.create_category(db=db, category=category)