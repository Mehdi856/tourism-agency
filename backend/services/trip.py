from fastapi import HTTPException
from db.supabase import supabase


#get all visual trips for frontend display
async def visualize_trips():
    try:
        resp = supabase.table("trip").select("*,hotel(*)").eq("visual", True).execute()
        return resp.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))