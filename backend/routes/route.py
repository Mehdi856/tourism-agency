from fastapi import APIRouter
from services.search import search_trips
from services.trip import visualize_trips
from services.booking import register_and_reserve,cancel_reservation,reserve
from models.models import fullregistration,Reservation

router=APIRouter()

@router.get("/visual")
async def get_v():
    return await visualize_trips()

@router.get("/search_trips")
async def search_t(startdate: str, enddate: str, location: str, numadults: int, numchild: int, rooms: int):
    return await search_trips(startdate, enddate, location, numadults, numchild, rooms)

@router.post("/register_and_reserve")
async def register_and_reserve_endpoint(data: fullregistration):
    return await register_and_reserve(data)


@router.delete("/cancel_reservation/{transaction_code}")
async def cancel_reservation_endpoint(transaction_code: str):
    return await cancel_reservation(transaction_code)

@router.post("/reserve")
async def reserve_endpoint(data: Reservation):
    return await reserve(data)



