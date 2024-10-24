from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel

app = FastAPI()

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