# fastapi
from fastapi import FastAPI, Request
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
# database
from .database import Base, engine
from .routers import router

# Initialize FastAPI
app = FastAPI()

# Initialize Database's Table
Base.metadata.create_all(bind = engine)

# Register Router
app.include_router(router=router, prefix="/api", tags=["todos"])

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

@app.get("/memory-game")
async def memory_game(request: Request):
    return templates.TemplateResponse("memory-game.html", {"request": request})

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
    # http://127.0.0.1:8000/