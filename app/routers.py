from fastapi import Depends, Form, File, APIRouter, HTTPException, Request, UploadFile
from fastapi.responses import HTMLResponse, RedirectResponse, JSONResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session
from werkzeug.security import generate_password_hash, check_password_hash
import os

from .schemas import TodoCreate, TodoResponse
from .models import Todo, User
from .database import SessionLocal

router = APIRouter()
templates = Jinja2Templates(directory="templates")

# Dependency: Database Session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- Todo APIs ---
@router.post("/todos", response_model=TodoResponse)
def create_todo(todo: TodoCreate, db: Session = Depends(get_db)):
    db_todo = Todo(**todo.dict())
    db.add(db_todo)
    db.commit()
    db.refresh(db_todo)
    return db_todo

@router.get("/todos", response_model=list[TodoResponse])
def get_todos(db: Session = Depends(get_db)):
    return db.query(Todo).all()

@router.get("/todos/{todo_id}", response_model=TodoResponse)
def read_todo(todo_id: int, db: Session = Depends(get_db)):
    db_todo = db.query(Todo).filter(Todo.id == todo_id).first()
    if not db_todo:
        raise HTTPException(status_code=404, detail="Todo not found")
    return db_todo

@router.put("/todos/{todo_id}", response_model=TodoResponse)
def update_todo(todo_id: int, todo: TodoCreate, db: Session = Depends(get_db)):
    db_todo = db.query(Todo).filter(Todo.id == todo_id).first()
    if not db_todo:
        raise HTTPException(status_code=404, detail="Todo not found")
    for key, value in todo.dict().items():
        setattr(db_todo, key, value)
    db.commit()
    db.refresh(db_todo)
    return db_todo

@router.delete("/todos/{todo_id}")
def delete_todo(todo_id: int, db: Session = Depends(get_db)):
    db_todo = db.query(Todo).filter(Todo.id == todo_id).first()
    if not db_todo:
        raise HTTPException(status_code=404, detail="Todo not found")
    db.delete(db_todo)
    db.commit()
    return {"detail": "Todo deleted successfully"}

# --- User/Auth APIs ---
@router.get("/login", response_class=HTMLResponse)
def login_form(request: Request):
    username = request.session.get('username')
    user_avatar = request.session.get('user_avatar', 'User-avatar.png')
    return templates.TemplateResponse("login.html", {"request": request, "username": username, "user_avatar": user_avatar})

@router.post("/login", response_class=JSONResponse)
def login(request: Request, username: str = Form(...), password: str = Form(...), db: Session = Depends(get_db)):
    user = db.query(User).filter_by(username=username).first()
    if not user:
        return JSONResponse({"error": "用戶不存在"}, status_code=400)
    if not verify_password(password, user.password):
        return JSONResponse({"error": "密碼錯誤"}, status_code=400)
    request.session['username'] = username
    request.session['user_avatar'] = user.profile_image or "User-avatar.png"
    return JSONResponse({"success": "登入成功", "redirect": "/"}, status_code=200)

@router.get("/register", response_class=HTMLResponse)
def register_form(request: Request):
    username = request.session.get('username')
    user_avatar = request.session.get('user_avatar', 'User-avatar.png')
    return templates.TemplateResponse("register.html", {"request": request, "username": username, "user_avatar": user_avatar})

@router.post("/register", response_class=JSONResponse)
def register(
    request: Request,
    username: str = Form(...),
    password: str = Form(...),
    profile_image: UploadFile = File(None),
    db: Session = Depends(get_db)
):
    if db.query(User).filter_by(username=username).first():
        return JSONResponse({"error": "用戶名已存在"}, status_code=400)

    if profile_image and profile_image.filename:
        if profile_image.content_type not in ["image/png", "image/jpeg"]:
            return JSONResponse({"error": "僅支持 PNG 和 JPG 格式的圖片"}, status_code=400)

    new_user = User(username=username, password=hash_password(password))
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    filename = "User-avatar.png"
    if profile_image and profile_image.filename:
        ext = ".png" if profile_image.content_type == "image/png" else ".jpg"
        filename = f"{new_user.id}{ext}"
        save_avatar(profile_image, filename)
    new_user.profile_image = filename
    db.commit()
    return JSONResponse({"success": "註冊成功", "redirect": "/login"}, status_code=201)

@router.get("/logout")
def logout(request: Request):
    request.session.pop('username', None)
    request.session.pop('user_avatar', None)
    return RedirectResponse(url="/", status_code=303)

@router.get("/setting")
def setting(request: Request):
    username = request.session.get('username')
    user_avatar = request.session.get('user_avatar', 'User-avatar.png')
    return templates.TemplateResponse("setting.html", {"request": request, "username": username, "user_avatar": user_avatar})

@router.post("/change_profile", response_class=JSONResponse)
def change_profile(request: Request, profile_image: UploadFile = File(None), db: Session = Depends(get_db)):
    username = request.session.get('username')
    user = db.query(User).filter_by(username=username).first()
    if not user:
        return JSONResponse({"error": "用戶不存在"}, status_code=400)
    if profile_image:
        if not profile_image.filename:
            return JSONResponse({"error": "請選擇頭像"}, status_code=400)
        if profile_image.content_type not in ["image/png", "image/jpeg"]:
            return JSONResponse({"error": "僅支持 PNG 和 JPG 格式的圖片"}, status_code=400)
        ext = ".png" if profile_image.content_type == "image/png" else ".jpg"
        filename = f"{user.id}{ext}"
        save_avatar(profile_image, filename)
        user.profile_image = filename
    db.commit()
    return JSONResponse({"success": "頭像已更新"}, status_code=200)

@router.post("/change_password", response_class=JSONResponse)
def change_password(
    request: Request,
    current_password: str = Form(None),
    new_password: str = Form(None),
    confirm_password: str = Form(None),
    db: Session = Depends(get_db)
):
    username = request.session.get('username')
    user = db.query(User).filter_by(username=username).first()
    if not current_password:
        return JSONResponse({"error": "請填寫目前密碼"}, status_code=400)
    if not new_password:
        return JSONResponse({"error": "請填寫新密碼"}, status_code=400)
    if not confirm_password:
        return JSONResponse({"error": "請填寫確認密碼"}, status_code=400)
    if not verify_password(current_password, user.password):
        return JSONResponse({"error": "目前密碼不正確"}, status_code=400)
    if new_password != confirm_password:
        return JSONResponse({"error": "新密碼和確認密碼不一致"}, status_code=400)
    user.password = hash_password(new_password)
    db.commit()
    return JSONResponse({"success": "密碼已更新"}, status_code=200)

# --- Utilities ---
def hash_password(plain_password: str) -> str:
    """對密碼進行哈希處理"""
    return generate_password_hash(plain_password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """驗證密碼是否匹配"""
    return check_password_hash(hashed_password, plain_password)

def save_avatar(profile_image: UploadFile, filename: str):
    """儲存頭像圖片到指定目錄"""
    avatar_dir = os.path.join("static", "images", "avatar")
    os.makedirs(avatar_dir, exist_ok=True)
    filepath = os.path.join(avatar_dir, filename)
    with open(filepath, "wb") as f:
        f.write(profile_image.file.read())