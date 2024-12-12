from sqlalchemy import Column, Integer, String, Boolean, Date

from .database import Base

#Define Model
class Todo(Base):
    __tablename__ = "todos"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(100), nullable=False)
    description = Column(String, nullable=True)
    completed = Column(Boolean, nullable=False)
    due_date = Column(Date, nullable=True)

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(122), nullable=False)
    password = Column(String(128), nullable=False)  # 確保欄位足夠長以存儲加密密碼
    email = Column(String(100), unique=True, nullable=True)
    profile_image = Column(String(120), nullable=True)