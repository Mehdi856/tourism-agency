import os
from dotenv import load_dotenv
from fastapi import FastAPI
from supabase import create_client

load_dotenv()

key=os.getenv("API_KEY")
url=os.getenv("BASE_URL")


supabase = create_client(url,key)
response = supabase.table("admin").select("*").execute()
print(response)