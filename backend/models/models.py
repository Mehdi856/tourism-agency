from pydantic import BaseModel, EmailStr
from datetime import date
from typing import Optional


class Admin(BaseModel):
    username: str
    password: str
    privileges: str


class Customer(BaseModel):
    fullname: str
    phonnum: str
    email: str
    birthdate: date


class Hotel(BaseModel):
    name: str
    rating: int
    img: str


class Trip(BaseModel):
    name: str
    descripiton: str
    price: float
    places: int
    start_date: date
    end_date: date
    visual: bool
    media: list[str]
    adults: int
    children: int
    room: int
    country: str
    hotel: Hotel


class Reservation(BaseModel):
    email: str
    trip_id: int
    confirmation: bool = False


class fullregistration(BaseModel):
    fullname: str
    phonnum: str
    email: str
    birthdate: date
    trip_id: int
    confirmation: bool = False
