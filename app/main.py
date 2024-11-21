from fastapi import FastAPI, Depends, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
# todolist
from sqlalchemy import create_engine, Column, Integer, String, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session

app = FastAPI()

# todolist
DATABASE_URL = "sqlite:///./todos.db"
Base = declarative_base()
engine = create_engine(DATABASE_URL, connect_args = {"check_same_thread" : False})
SessionLocal = sessionmaker(autocommit = False, autoflush = False, bind = engine)

#Define Model
class Todo(Base):
    __tablename__ = "todos"
    id = Column(Integer, primary_key = True, Index = True)
    title = Column(String, nullable = False)
    desceiption = Column(String, nullable = True)
    completed = Column(Boolean, nullable = False)

# Initialize Database's Table
Base.metadata.create_all(bind = engine)

'''
VALIDATION
'''

#Pydantic
class TodoBase(BaseModel):
    title : str
    desription : str | None = None
    completed : bool = False

class TodoCreate(TodoBase):
    pass

class TodoResponse(TodoBase):
    id : int

    class config:
        orm_mode = True

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

@app.post("/todos", response_model = TodoResponse)
def create_todo(todo : TodoCreate, db : Session = Depends(get_db())):
    db_todo = Todo(**todo.dict())
    db.add(db_todo)
    db.commit()
    db.refresh(db_todo)
    return db_todo

@app.get("/todos", response_model = list[TodoResponse])
def get_todos(db : Session = Depends(get_db())):
    todos = db.query(Todo).all()
    return todos

@app.get("/todos/{todo_id}", response_model = TodoResponse)
def read_todo(todo_id : int, db : Session = Depends(get_db())):
    db_todo = db.query(Todo).filter(Todo.id == todo_id).first()
    if db_todo is None:
        raise HTTPException(status_code = 404, detail = "Todo not found")
    return db_todo

@app.put("/todos/{todo_id}", response_model = TodoResponse)
def update_todo(todo_id : int, todo : TodoCreate, db : Session = Depends(get_db())):
    db_todo = db.query(Todo).filter(Todo.id == todo_id).first()
    if db_todo is None:
        raise HTTPException(status_code = 404, detail = "Todo not found")
    for key, value in todo.dict().items():
        setattr(db_todo, key, value)
    db.commit()
    db.refresh(db_todo)
    return db_todo

@app.delete("/todos/{todo_id}", status_code = 204)
def delete_todo(todo_id : int, db : Session = Depends(get_db())):
    db_todo = db.query(Todo).filter(Todo.id == todo_id).first()
    if db_todo is None:
        raise HTTPException(status_code = 404, detail = "Todo not found")
    db.delete(db_todo)
    db.commit()
    return {"detail" : "Todo deleted successfully"}

'''
STATIC FILES
'''

# 設置靜態文件夾
app.mount("/static", StaticFiles(directory="static"), name="static")

class Item(BaseModel):
    name: str
    price: float
    description: str = "abc"

@app.get("/")
async def read_index():
    return FileResponse("index.html")

@app.get("/items")
async def creat_items(itme: Item):
    return {"name": itme.name, "description": itme.description}