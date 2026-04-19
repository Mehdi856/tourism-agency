from fastapi import APIRouter
from services.search import search_trips
from services.trip import visualize_trips

router=APIRouter()

@router.get("/visual")
async def get_v():
    return await visualize_trips()

@router.get("/search_trips")
async def search_t(startdate: str, enddate: str, location: str, numadults: int, numchild: int):
    return await search_trips(startdate, enddate, location, numadults, numchild)

