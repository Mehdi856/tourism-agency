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
 
 
class Trip(BaseModel):
    name: str
    descripiton: str    
    price: float
    places: int
    start_date: date    
    end_date: date   
    visual: bool   
    media: list[str]    
 
 
class Reservation(BaseModel):
    customer_id: int
    trip_id: int
    confirmation: bool = False

class fullregistration(BaseModel):
    fullname: str
    phonnum: str        
    email: str
    birthdate: date
    trip_id: int
    confirmation: bool = False
