from fastapi import Depends, Form, File, APIRouter, HTTPException, Request, UploadFile
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session
from werkzeug.security import generate_password_hash, check_password_hash
from fastapi.responses import JSONResponse
import os

from .schemas import TodoCreate, TodoResponse
from .models import Todo, User
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
Todos
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

'''
Users
'''

# 設置模板
templates = Jinja2Templates(directory="templates")

# 登入帳號
@router.get("/login", response_class=HTMLResponse)
def login_form(request: Request):
    username = request.session.get('username')
    user_avatar = request.session.get('user_avatar', 'User-avatar.png')
    return templates.TemplateResponse("login.html", {"request": request, "username": username, "user_avatar": user_avatar})

@router.post("/login", response_class=HTMLResponse)
def login(request: Request, username: str = Form(...), password: str = Form(...), db: Session = Depends(get_db)):
    user = db.query(User).filter_by(username=username).first()
    if user is None:
        error = '用戶不存在'
        return templates.TemplateResponse("login.html", {"request": request, "error": error})
    elif not verify_password(password, user.password):
        error = '密碼錯誤'
        return templates.TemplateResponse("login.html", {"request": request, "error": error})
    else:
        request.session['username'] = username
        request.session['user_avatar'] = user.profile_image
        return RedirectResponse(url="/", status_code=303)

# 註冊帳號
@router.get("/register", response_class=HTMLResponse)
def register_form(request: Request):
    username = request.session.get('username')
    user_avatar = request.session.get('user_avatar', 'User-avatar.png')
    return templates.TemplateResponse("register.html", {"request": request, "username": username, "user_avatar": user_avatar})

@router.post("/register", response_class=HTMLResponse)
def register(request: Request, username: str = Form(...), password: str = Form(...), profile_image: UploadFile = File(None), db: Session = Depends(get_db)):
    # 檢查用戶是否已存在
    if db.query(User).filter_by(username=username).first():
        return templates.TemplateResponse("register.html", {"request": request, "error": "用戶名已存在"})

    # 檢查圖片格式（如果有上傳圖片）
    if profile_image and profile_image.filename:  # 確保有選擇文件
        if profile_image.content_type not in ["image/png", "image/jpeg"]:
            return templates.TemplateResponse("register.html", {"request": request, "error": "僅支持 PNG 和 JPG 格式的圖片"})

    # 創建新用戶
    new_user = User(username=username, password=hash_password(password))
    db.add(new_user)
    db.commit()
    db.refresh(new_user)  # 獲取用戶 ID

    # 處理頭像文件
    if profile_image and profile_image.filename:  # 確保有文件被上傳
        ext = ".png" if profile_image.content_type == "image/png" else ".jpg"
        filename = f"{new_user.id}{ext}"
        filepath = os.path.join("static/images/avatar", filename)
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        with open(filepath, "wb") as f:
            f.write(profile_image.file.read())
    else:
        filename = "User-avatar.png"

    # 更新用戶的頭像字段
    new_user.profile_image = filename
    db.commit()

    # 跳轉到登入頁面
    return RedirectResponse(url="/login", status_code=303)

# 登出帳號
@router.get("/logout")
def logout(request: Request):
    request.session.pop('username', None)
    request.session.pop('user_avatar', None)
    return RedirectResponse(url="/", status_code=303)

# 設定頁面
@router.get("/setting")
def setting(request: Request):
    username = request.session.get('username')
    user_avatar = request.session.get('user_avatar', 'User-avatar.png')
    return templates.TemplateResponse("setting.html", {"request": request, "username": username, "user_avatar": user_avatar})

@router.post("/change_profile", response_class=HTMLResponse)
def setting(request: Request, profile_image: UploadFile = File(None), db: Session = Depends(get_db)):
    username = request.session.get('username')
    user = db.query(User).filter_by(username=username).first()

    if not user:
        return JSONResponse({"error": "用戶不存在"}, status_code=400)

    # 更新頭像
    if profile_image:
        if not profile_image.filename:
            return JSONResponse({"error": "請選擇頭像"}, status_code=400)
        if profile_image.content_type not in ["image/png", "image/jpeg"]:
            return JSONResponse({"error": "僅支持 PNG 和 JPG 格式的圖片"}, status_code=400)

        ext = ".png" if profile_image.content_type == "image/png" else ".jpg"
        filename = f"{user.id}{ext}"
        filepath = os.path.join("static/images/avatar", filename)
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        with open(filepath, "wb") as f:
            f.write(profile_image.file.read())

        user.profile_image = filename

    # 如果用戶之前沒有頭像，更新為新頭像名稱
    if user.profile_image == "User-avatar.png":
        user.profile_image = filename

    db.commit()
    return JSONResponse({"success": "頭像已更新"}, status_code=200)

@router.post("/change_password", response_class=HTMLResponse)
def change_password(request: Request, current_password: str = Form(None), new_password: str = Form(None), confirm_password: str = Form(None), db: Session = Depends(get_db)):
    username = request.session.get('username')
    user = db.query(User).filter_by(username=username).first()

    if not user:
        return JSONResponse({"error": "用戶不存在"}, status_code=400)

    # 更改密碼
    if current_password and new_password and confirm_password:
        if not verify_password(current_password, user.password):
            return JSONResponse({"error": "目前密碼不正確"}, status_code=400)

        if new_password != confirm_password:
            return JSONResponse({"error": "新密碼和確認密碼不匹配"}, status_code=400)

        user.password = hash_password(new_password)
        
    else:
        if not current_password:
            return JSONResponse({"error": "請輸入密碼"}, status_code=400)
        if not new_password:
            return JSONResponse({"error": "請輸入新密碼"}, status_code=400)
        if not confirm_password:
            return JSONResponse({"error": "請輸入確認新密碼"}, status_code=400)
    
    db.commit()
    return JSONResponse({"success": "密碼已更新"}, status_code=200)

def hash_password(plain_password: str) -> str:
    """對密碼進行哈希處理"""
    return generate_password_hash(plain_password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """驗證密碼是否匹配"""
    return check_password_hash(hashed_password, plain_password)