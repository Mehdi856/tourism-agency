from fastapi import HTTPException
from db.supabase import supabase
from models.models import Trip


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


# Add a new trip (admin only)
async def add_trip(data: Trip):
    try:
        # Step 1: Insert the hotel and get its generated ID
        hotel_resp = (
            supabase.table("hotel")
            .insert({
                "name": data.hotel.name,
                "rating": data.hotel.rating,
                "img": data.hotel.img,
            })
            .execute()
        )

        if not hotel_resp.data:
            raise HTTPException(status_code=500, detail="Failed to create hotel")

        hotel_id = hotel_resp.data[0]["id"]

        # Step 2: Insert the trip linked to the newly created hotel
        trip_resp = (
            supabase.table("trip")
            .insert({
                "name": data.name,
                "descripiton": data.descripiton,
                "price": data.price,
                "places": data.places,
                "date": f"[{data.start_date},{data.end_date}]",  # daterange format
                "visual": data.visual,
                "media": data.media,
                "adults": data.adults,
                "children": data.children,
                "room": data.room,
                "country": data.country,
                "hotel_id": hotel_id,
            })
            .execute()
        )

        if not trip_resp.data:
            raise HTTPException(status_code=500, detail="Failed to create trip")

        return {
            "message": "Trip created successfully",
            "trip": trip_resp.data[0],
            "hotel": hotel_resp.data[0],
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
