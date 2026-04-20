import requests

BASE_URL = "http://localhost:8000"

# ==================search function is working========================
# params = {
#     "location": "Bousaada",
#     "startdate": "2025-06-01",
#     "enddate": "2025-06-10",
#     "numadults": 1,
#     "numchild": 0,
#     "rooms": 2
# }

# response = requests.get(f"{BASE_URL}/search_trips", params=params)

# print(response.url)
# print(response.status_code)
# print(response.text)
#=======================================================================

#==================visualization function is working==================
# response=requests.get(f"{BASE_URL}/visual")
# print(response.url)
# print(response.status_code)
# print(response.text)
#======================================================================

#===============register and reserve function is working================
# person={
#     "fullname": "Mehdi Benbakhta",
#     "phonnum": "1234567890",
#     "email": "aitm9953@gmail.com",
#     "birthdate": "2005-10-01",
#     "trip_id": 1,
#     "confirmation": False
# }
# response=requests.post(f"{BASE_URL}/register_and_reserve", json=person)
# print(response.url)
# print(response.status_code)
# print(response.text)

#=========================================================================
# ===============cancel reservation function is working========================
# transaction_code="JMR9U0ZPZM"
# response=requests.delete(f"{BASE_URL}/cancel_reservation/{transaction_code}")
# print(response.url)
# print(response.status_code)
# print(response.text)
# ==============================================================================
# ===============reserve function is working========================
# reservation_data = {
#     "email":"m.benkacimi@etu.univ-batna2.dz",
#     "trip_id": 1,
#     "confirmation": False
# }

# response=requests.post(f"{BASE_URL}/reserve", json=reservation_data)
# print(response.url)
# print(response.status_code)
# print(response.text)
# ==============================================================================


# ===============get trip details========================
response = requests.get(f"{BASE_URL}/trip/1")
print(response.url)
print(response.status_code)
print(response.text)
# ==============================================================================
