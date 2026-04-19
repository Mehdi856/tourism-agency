import requests

BASE_URL = "http://localhost:8000"

params = {
    "location": "Bousaada",
    "startdate": "2025-06-01",
    "enddate": "2025-06-10",
    "numadults": 1,
    "numchild": 0
}

response = requests.get(f"{BASE_URL}/search_trips", params=params)

print(response.url)
print(response.status_code)
print(response.text)

response=requests.get(f"{BASE_URL}/visual")
print(response.url)
print(response.status_code)
print(response.text)