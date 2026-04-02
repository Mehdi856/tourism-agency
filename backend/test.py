import requests

test_url = "http://localhost:8000"


def search_trips(name=None, location=None):
    params = {}
    if name:
        params["name"] = name
    if location:
        params["location"] = location

    response = requests.get(f"{test_url}/search_trips", params=params)

    print("Status:", response.status_code)
    print("Response:", response.text)  # 👈 VERY IMPORTANT

    assert response.status_code == 200

name = input("Enter trip name to search (or press Enter to skip): ")
location = input("Enter trip location to search (or press Enter to skip): ")
search_trips(name=name if name else None, location=location if location else None)
