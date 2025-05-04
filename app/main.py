# fastapi
from fastapi import FastAPI, Request
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
from starlette.middleware.sessions import SessionMiddleware
# database
from .database import Base, engine
from .routers import router

# Initialize FastAPI
app = FastAPI()

# Initialize Database's Table
# Base.metadata.create_all(bind = engine)

# Register Router
app.include_router(router=router, prefix="/api", tags=["todos"])
app.include_router(router=router)
'''
STATIC FILES
'''

# 設置 HTML文件夾
templates = Jinja2Templates(directory="templates")
# 設置靜態文件夾
app.mount("/static", StaticFiles(directory="static"), name="static")
# 添加 SessionMiddleware 以啟用會話支持
app.add_middleware(SessionMiddleware, secret_key="your_secret_key")

# Define routes
@app.get("/", response_class=HTMLResponse)
async def read_item(request: Request):
    username = request.session.get('username')
    user_avatar = request.session.get('user_avatar', 'User-avatar.png')
    return templates.TemplateResponse("index.html", {"request": request, "username": username, "user_avatar": user_avatar})

@app.get("/minesweeper", response_class=HTMLResponse)
async def minesweeper(request: Request):
    username = request.session.get('username')
    user_avatar = request.session.get('user_avatar', 'User-avatar.png')
    return templates.TemplateResponse("minesweeper.html", {"request": request, "username": username, "user_avatar": user_avatar})

@app.get("/memory-game", response_class=HTMLResponse)
async def memory_game(request: Request):
    username = request.session.get('username')
    user_avatar = request.session.get('user_avatar', 'User-avatar.png')
    return templates.TemplateResponse("memory-game.html", {"request": request, "username": username, "user_avatar": user_avatar})

@app.get("/spinning-top", response_class=HTMLResponse)
async def memory_game(request: Request):
    username = request.session.get('username')
    user_avatar = request.session.get('user_avatar', 'User-avatar.png')
    return templates.TemplateResponse("spinning-top.html", {"request": request, "username": username, "user_avatar": user_avatar})

@app.get("/solitaire", response_class=HTMLResponse)
async def memory_game(request: Request):
    username = request.session.get('username')
    user_avatar = request.session.get('user_avatar', 'User-avatar.png')
    return templates.TemplateResponse("solitaire.html", {"request": request, "username": username, "user_avatar": user_avatar})

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
    # pipenv run uvicorn app.main:app --reload
    # http://127.0.0.1:8000/