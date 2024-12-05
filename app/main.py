# fastapi
from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
# todolist
from pydantic import BaseModel
from sqlalchemy import create_engine, Column, Integer, String, Boolean, Date
from sqlalchemy.orm import  declarative_base, sessionmaker, Session

app = FastAPI()

# todolist
DATABASE_URL = "sqlite:///./todos.db"
Base = declarative_base()
engine = create_engine(DATABASE_URL, connect_args = {"check_same_thread" : False})
SessionLocal = sessionmaker(autocommit = False, autoflush = False, bind = engine)

#Define Model
class Todo(Base):
    __tablename__ = "todos"
    id = Column(Integer, primary_key = True, index = True)
    title = Column(String(100), nullable = False)
    description = Column(String, nullable = True)
    completed = Column(Boolean, nullable = False)
    due_date = Column(Date, nullable = True)

# Initialize Database's Table
Base.metadata.create_all(bind = engine)

'''
VALIDATION
'''

#Pydantic
class TodoBase(BaseModel):
    title : str
    description : str | None = None
    completed : bool = False

class TodoCreate(TodoBase):
    pass

class TodoResponse(TodoBase):
    id : int

    class config:
        form_attributes = True

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
def create_todo(todo : TodoCreate, db : Session = Depends(get_db)):
    db_todo = Todo(**todo.dict())
    db.add(db_todo)
    db.commit()
    db.refresh(db_todo)
    return db_todo

@app.get("/todos", response_model = list[TodoResponse])
def get_todos(db : Session = Depends(get_db)):
    todos = db.query(Todo).all()
    return todos

@app.get("/todos/{todo_id}", response_model = TodoResponse)
def read_todo(todo_id : int, db : Session = Depends(get_db)):
    db_todo = db.query(Todo).filter(Todo.id == todo_id).first()
    if db_todo is None:
        raise HTTPException(status_code = 404, detail = "Todo not found")
    return db_todo

@app.put("/todos/{todo_id}", response_model = TodoResponse)
def update_todo(todo_id : int, todo : TodoCreate, db : Session = Depends(get_db)):
    db_todo = db.query(Todo).filter(Todo.id == todo_id).first()
    if db_todo is None:
        raise HTTPException(status_code = 404, detail = "Todo not found")
    for key, value in todo.dict().items():
        setattr(db_todo, key, value)
    db.commit()
    db.refresh(db_todo)
    return db_todo

@app.delete("/todos/{todo_id}")
def delete_todo(todo_id : int, db : Session = Depends(get_db)):
    db_todo = db.query(Todo).filter(Todo.id == todo_id).first()
    if db_todo is None:
        raise HTTPException(status_code = 404, detail = "Todo not found")
    db.delete(db_todo)
    db.commit()
    return {"detail" : "Todo deleted successfully"}

'''
STATIC FILES
'''

templates = Jinja2Templates(directory="templates")

# 設置靜態文件夾
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
async def read_item(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

@app.get("/minesweeper")
async def minesweeper(request: Request):
    return templates.TemplateResponse("minesweeper.html", {"request": request})

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
    # http://127.0.0.1:8000/