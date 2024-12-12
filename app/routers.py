from fastapi import Depends, APIRouter, HTTPException
from sqlalchemy.orm import Session

from .schemas import TodoCreate, TodoResponse
from .models import Todo
from .database import SessionLocal

router = APIRouter()

# Database Injection
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

'''
ROUTING
'''

@router.post("/todos", response_model = TodoResponse)
def create_todo(todo : TodoCreate, db : Session = Depends(get_db)):
    db_todo = Todo(**todo.dict())
    db.add(db_todo)
    db.commit()
    db.refresh(db_todo)
    return db_todo

@router.get("/todos", response_model = list[TodoResponse])
def get_todos(db : Session = Depends(get_db)):
    todos = db.query(Todo).all()
    return todos

@router.get("/todos/{todo_id}", response_model = TodoResponse)
def read_todo(todo_id : int, db : Session = Depends(get_db)):
    db_todo = db.query(Todo).filter(Todo.id == todo_id).first()
    if db_todo is None:
        raise HTTPException(status_code = 404, detail = "Todo not found")
    return db_todo

@router.put("/todos/{todo_id}", response_model = TodoResponse)
def update_todo(todo_id : int, todo : TodoCreate, db : Session = Depends(get_db)):
    db_todo = db.query(Todo).filter(Todo.id == todo_id).first()
    if db_todo is None:
        raise HTTPException(status_code = 404, detail = "Todo not found")
    for key, value in todo.dict().items():
        setattr(db_todo, key, value)
    db.commit()
    db.refresh(db_todo)
    return db_todo

@router.delete("/todos/{todo_id}")
def delete_todo(todo_id : int, db : Session = Depends(get_db)):
    db_todo = db.query(Todo).filter(Todo.id == todo_id).first()
    if db_todo is None:
        raise HTTPException(status_code = 404, detail = "Todo not found")
    db.delete(db_todo)
    db.commit()
    return {"detail" : "Todo deleted successfully"}