from fastapi import HTTPException
from db.supabase import supabase


# ─────────────────────────────────────────────
# SEARCH TRIPS
# ─────────────────────────────────────────────

async def search_trips(startdate, enddate, location, numadults, numchild):
    try:
        response = (
            supabase
            .table("trip")
            .select("*, hotel(*)")
            .filter("date", "cs", f"[{startdate},{enddate})")
            .eq("adults", numadults)
            .eq("children", numchild)
            .ilike("name", f"%{location}%")
            .execute()
        )
        return response.data

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))