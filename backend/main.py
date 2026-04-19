from fastapi import FastAPI
from routes.route import router as approuter




app = FastAPI()

app.include_router(approuter)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="localhost", port=8000, reload=True)
