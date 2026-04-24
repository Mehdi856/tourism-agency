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
            .select("*, hotel(*), flight(*)")
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


# Add a new trip (admin only) — hotel & flights are created first, then linked to the trip
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
                "date": f"[{data.start_date},{data.end_date}]",
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

        trip_id = trip_resp.data[0]["id"]

        # Step 3: Insert both flights (outbound + return) linked to the trip
        flights_to_insert = [
            {
                "trip_id": trip_id,
                "company": data.outbound_flight.company,
                "flight_code": data.outbound_flight.flight_code,
                "class": data.outbound_flight.class_,
                "departure_location": data.outbound_flight.departure_location,
                "departure_time": data.outbound_flight.departure_time,
                "arrival_location": data.outbound_flight.arrival_location,
                "arrival_time": data.outbound_flight.arrival_time,
                "duration": data.outbound_flight.duration,
                "is_direct": data.outbound_flight.is_direct,
            },
            {
                "trip_id": trip_id,
                "company": data.return_flight.company,
                "flight_code": data.return_flight.flight_code,
                "class": data.return_flight.class_,
                "departure_location": data.return_flight.departure_location,
                "departure_time": data.return_flight.departure_time,
                "arrival_location": data.return_flight.arrival_location,
                "arrival_time": data.return_flight.arrival_time,
                "duration": data.return_flight.duration,
                "is_direct": data.return_flight.is_direct,
            },
        ]

        flights_resp = (
            supabase.table("flight")
            .insert(flights_to_insert)
            .execute()
        )
        if not flights_resp.data:
            raise HTTPException(status_code=500, detail="Failed to create flights")

        return {
            "message": "Trip created successfully",
            "trip": trip_resp.data[0],
            "hotel": hotel_resp.data[0],
            "flights": flights_resp.data,
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Calculate total cost of a trip (admin only)
async def calculate_cost(trip_id: int):
    try:
        resp = (
            supabase.table("trip")
            .select("name, price, adults, children")
            .eq("id", trip_id)
            .execute()
        )
        if not resp.data:
            raise HTTPException(status_code=404, detail="Trip not found")

        trip = resp.data[0]

        raw_price = str(trip.get("price") or "0").replace("$", "").replace(",", "").strip()
        price_per_person = float(raw_price)

        adults = trip["adults"]
        children = trip["children"]
        total = price_per_person * (adults + children)

        return {
            "trip_name": trip["name"],
            "price_per_person": price_per_person,
            "adults": adults,
            "children": children,
            "total_cost": total,
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Dashboard overview (admin only)
async def get_overview():
    try:
        # --- Total bookings & pending count ---
        reservations_resp = (
            supabase.table("reservation")
            .select("*, customer(*), trip(*)")
            .execute()
        )
        reservations = reservations_resp.data or []
        total_bookings = len(reservations)
        pending_count = sum(1 for r in reservations if not r["confirmation"])

        # --- Total revenue: sum of confirmed reservations trip prices ---
        total_revenue = 0.0
        for r in reservations:
            if r["confirmation"] and r.get("trip"):
                raw = str(r["trip"].get("price") or "0").replace("$", "").replace(",", "").strip()
                total_revenue += float(raw)

        # --- Active trips (trips that still have available places) ---
        trips_resp = supabase.table("trip").select("id, name, places, country, price").execute()
        trips = trips_resp.data or []
        active_trips = [t for t in trips if t["places"] > 0]

        # --- Top routes: count reservations per country ---
        country_counts = {}
        for r in reservations:
            if r.get("trip") and r["trip"].get("country"):
                country = r["trip"]["country"]
                country_counts[country] = country_counts.get(country, 0) + 1

        top_routes = sorted(
            [{"country": k, "bookings": v} for k, v in country_counts.items()],
            key=lambda x: x["bookings"],
            reverse=True
        )[:5]

        # --- Recent bookings (last 5) ---
        recent_bookings = []
        for r in reservations[-5:][::-1]:
            customer = r.get("customer") or {}
            trip = r.get("trip") or {}
            raw_price = str(trip.get("price") or "0").replace("$", "").replace(",", "").strip()
            recent_bookings.append({
                "transaction_code": r["transaction_code"],
                "customer_name": customer.get("fullname", "—"),
                "customer_email": customer.get("email", "—"),
                "trip_name": trip.get("name", "—"),
                "country": trip.get("country", "—"),
                "confirmed": r["confirmation"],
                "revenue": float(raw_price),
            })

        return {
            "total_revenue": total_revenue,
            "total_bookings": total_bookings,
            "pending_count": pending_count,
            "active_trips": len(active_trips),
            "top_routes": top_routes,
            "recent_bookings": recent_bookings,
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
