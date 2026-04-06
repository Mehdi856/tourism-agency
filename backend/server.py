import os
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from supabase import create_client
from models import fullregistration, Reservation, Customer, Trip, Admin

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


# ─────────────────────────────────────────────
# SEARCH TRIPS
# ─────────────────────────────────────────────
@app.get("/search_trips")
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


# ─────────────────────────────────────────────
# 1. FULL REGISTRATION + RESERVATION (new customer)
#    uses: fullregistration model
# ─────────────────────────────────────────────
@app.post("/register_and_reserve")
async def register_and_reserve(data: fullregistration):
    try:
        # Check trip exists and has places
        trip_resp = supabase.table("trip").select("*").eq("id", data.trip_id).execute()
        if not trip_resp.data:
            raise HTTPException(status_code=404, detail="Trip not found")

        trip = trip_resp.data[0]
        if trip["places"] <= 0:
            raise HTTPException(status_code=400, detail="No available places for this trip")

        # Check if customer already exists by email
        customer_resp = supabase.table("customer").select("id").eq("email", data.email).execute()

        if customer_resp.data:
            customer_id = customer_resp.data[0]["id"]
        else:
            new_customer = Customer(
                fullname=data.fullname,
                phonnum=data.phonnum,
                email=data.email,
                birthdate=data.birthdate,
            )
            insert_resp = supabase.table("customer").insert({
                "fullname": new_customer.fullname,
                "phonnum": new_customer.phonnum,
                "email": new_customer.email,
                "birthdate": str(new_customer.birthdate),
            }).execute()
            customer_id = insert_resp.data[0]["id"]

        # Check for duplicate reservation
        existing = supabase.table("reservation") \
            .select("*") \
            .eq("customer_id", customer_id) \
            .eq("trip_id", data.trip_id) \
            .execute()
        if existing.data:
            raise HTTPException(status_code=409, detail="Reservation already exists for this customer and trip")

        transaction_code = generate_unique_code(supabase)

        supabase.table("reservation").insert({
            "customer_id": customer_id,
            "trip_id": data.trip_id,
            "confirmation": data.confirmation,
            "transaction_code": transaction_code,
        }).execute()

        supabase.table("trip").update({"places": trip["places"] - 1}).eq("id", data.trip_id).execute()

        return {
            "message": "Reservation created successfully",
            "transaction_code": transaction_code,
            "customer_id": customer_id,
            "trip_id": data.trip_id,
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─────────────────────────────────────────────
# 2. RESERVE ONLY (existing customer by email)
#    uses: Reservation model
# ─────────────────────────────────────────────
@app.post("/reserve")
async def reserve(data: Reservation):
    try:
        # Find customer by email
        customer_resp = supabase.table("customer").select("id").eq("email", data.email).execute()
        if not customer_resp.data:
            raise HTTPException(status_code=404, detail="Customer not found")

        customer_id = customer_resp.data[0]["id"]

        # Verify trip exists and has places
        trip_resp = supabase.table("trip").select("*").eq("id", data.trip_id).execute()
        if not trip_resp.data:
            raise HTTPException(status_code=404, detail="Trip not found")

        trip = trip_resp.data[0]
        if trip["places"] <= 0:
            raise HTTPException(status_code=400, detail="No available places for this trip")

        # Check duplicate reservation
        existing = supabase.table("reservation") \
            .select("*") \
            .eq("customer_id", customer_id) \
            .eq("trip_id", data.trip_id) \
            .execute()
        if existing.data:
            raise HTTPException(status_code=409, detail="Reservation already exists")

        transaction_code = generate_unique_code(supabase)

        supabase.table("reservation").insert({
            "customer_id": customer_id,
            "trip_id": data.trip_id,
            "confirmation": data.confirmation,
            "transaction_code": transaction_code,
        }).execute()

        supabase.table("trip").update({"places": trip["places"] - 1}).eq("id", data.trip_id).execute()

        return {
            "message": "Reservation created successfully",
            "transaction_code": transaction_code,
            "customer_id": customer_id,
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─────────────────────────────────────────────
# 3. GET RESERVATION by transaction code
# ─────────────────────────────────────────────
@app.get("/reservation/{transaction_code}")
async def get_reservation(transaction_code: str):
    try:
        resp = supabase.table("reservation") \
            .select("*, customer(*), trip(*)") \
            .eq("transaction_code", transaction_code) \
            .execute()
        if not resp.data:
            raise HTTPException(status_code=404, detail="Reservation not found")
        return resp.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─────────────────────────────────────────────
# 4. CANCEL RESERVATION by transaction code
# ─────────────────────────────────────────────
@app.delete("/reservation/{transaction_code}")
async def cancel_reservation(transaction_code: str):
    try:
        resp = supabase.table("reservation") \
            .select("*") \
            .eq("transaction_code", transaction_code) \
            .execute()
        if not resp.data:
            raise HTTPException(status_code=404, detail="Reservation not found")

        res = resp.data[0]

        supabase.table("reservation") \
            .delete() \
            .eq("transaction_code", transaction_code) \
            .execute()

        # Restore place count
        trip_resp = supabase.table("trip").select("places").eq("id", res["trip_id"]).execute()
        if trip_resp.data:
            current_places = trip_resp.data[0]["places"]
            supabase.table("trip").update({"places": current_places + 1}).eq("id", res["trip_id"]).execute()

        return {"message": "Reservation cancelled successfully"}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

#get all visual trips for frontend display
@app.get("/visual_trips")    
async def visualize_trips():
    try:
        resp = supabase.table("trip").select("*").eq("visual", True).execute()
        return resp.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    



if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="localhost", port=8000, reload=True)
