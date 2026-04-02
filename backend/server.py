import os
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from supabase import create_client
from models import fullregistration

load_dotenv()
app = FastAPI()


key = os.getenv("API_KEY")
url = os.getenv("BASE_URL")

if not key or not url:
    raise RuntimeError("API_KEY or BASE_URL not set in .env")

supabase = create_client(url, key)

def generate_unique_code(supabase, length=10):
    import random
    import string

    while True:
        code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=length))
        response = supabase.table("reservation").select("transaction_code").eq("transaction_code", code).execute()
        if not response.data or len(response.data) == 0:
            return code
    
@app.get("/search_trips") # search by name and location
async def search_trips(name: str = None, location: str = None):
    try:
        query = supabase.table("trip").select("*")
        if name:
            query = query.ilike("name", f"%{name}%")
        if location:
            query = query.ilike("location", f"%{location}%")
        response = query.execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="localhost", port=8000, reload=True)