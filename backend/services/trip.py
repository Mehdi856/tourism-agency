from fastapi import HTTPException
from db.supabase import supabase


# Get all visual trips for frontend display
async def visualize_trips():
    try:
        resp = supabase.table("trip").select("*,hotel(*)").eq("visual", True).execute()
        return resp.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Get full details of a single trip for the details page
async def get_trip_details(trip_id: int):
    try:
        resp = (
            supabase.table("trip")
            .select("*, hotel(*)")
            .eq("id", trip_id)
            .execute()
        )
        if not resp.data:
            raise HTTPException(status_code=404, detail="Trip not found")

        trip = resp.data[0]

        # MONEY type comes as string e.g. "$4,850.00" — clean it up
        raw_price = str(trip.get("price") or "0").replace("$", "").replace(",", "").strip()
        trip["price_value"] = float(raw_price)

        return trip

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
