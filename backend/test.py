import requests

test_url = "http://localhost:8000"


def print_result(label, response):
    print(f"\n{'='*50}")
    print(f"TEST: {label}")
    print(f"Status: {response.status_code}")
    try:
        print(f"Response: {response.json()}")
    except:
        print(f"Response: {response.text}")
    print('='*50)


# ─────────────────────────────────────────────
# 1. SEARCH TRIPS
# ─────────────────────────────────────────────
def test_search_trips():
    name = input("\nEnter trip name to search (or press Enter to skip): ")
    location = input("Enter trip location to search (or press Enter to skip): ")

    params = {}
    if name:
        params["name"] = name
    if location:
        params["location"] = location

    response = requests.get(f"{test_url}/search_trips", params=params)
    print_result("Search Trips", response)
    return response.status_code == 200


# ─────────────────────────────────────────────
# 2. REGISTER AND RESERVE (new customer)
# ─────────────────────────────────────────────
def test_register_and_reserve():
    print("\n--- Register & Reserve (new customer) ---")
    data = {
        "fullname": input("Full name: "),
        "phonnum": input("Phone number: "),
        "email": input("Email: "),
        "birthdate": input("Birthdate (YYYY-MM-DD): "),
        "trip_id": int(input("Trip ID: ")),
        "confirmation": False
    }

    response = requests.post(f"{test_url}/register_and_reserve", json=data)
    print_result("Register & Reserve", response)

    if response.status_code == 200:
        return response.json().get("transaction_code")
    return None


# ─────────────────────────────────────────────
# 3. RESERVE ONLY (existing customer)
# ─────────────────────────────────────────────
def test_reserve():
    print("\n--- Reserve (existing customer) ---")
    data = {
        "email": input("Customer email: "),
        "trip_id": int(input("Trip ID: ")),
        "confirmation": False
    }

    response = requests.post(f"{test_url}/reserve", json=data)
    print_result("Reserve", response)

    if response.status_code == 200:
        return response.json().get("transaction_code")
    return None

# ─────────────────────────────────────────────
# 4. GET RESERVATION
# ─────────────────────────────────────────────
def test_get_reservation(transaction_code=None):
    print("\n--- Get Reservation ---")
    if not transaction_code:
        transaction_code = input("Enter transaction code: ")

    response = requests.get(f"{test_url}/reservation/{transaction_code}")
    print_result("Get Reservation", response)
    return response.status_code == 200


# ─────────────────────────────────────────────
# 5. CANCEL RESERVATION
# ─────────────────────────────────────────────
def test_cancel_reservation(transaction_code=None):
    print("\n--- Cancel Reservation ---")
    if not transaction_code:
        transaction_code = input("Enter transaction code to cancel: ")

    response = requests.delete(f"{test_url}/reservation/{transaction_code}")
    print_result("Cancel Reservation", response)
    return response.status_code == 200


# ─────────────────────────────────────────────
# MENU
# ─────────────────────────────────────────────
def menu():
    print("\n" + "="*50)
    print("   MAKE MY TRIP - API TESTER")
    print("="*50)
    print("1. Search Trips")
    print("2. Register & Reserve (new customer)")
    print("3. Reserve only (existing customer)")
    print("4. Get Reservation by transaction code")
    print("5. Cancel Reservation")
    print("6. Full flow test (register → get → cancel)")
    print("0. Exit")
    print("="*50)
    return input("Choose an option: ").strip()


def full_flow_test():
    print("\n🔁 Running full flow: Register → Get → Cancel")
    code = test_register_and_reserve()
    if code:
        print(f"\n✅ Got transaction code: {code}")
        test_get_reservation(code)
        confirm = input("\nDo you want to cancel this reservation? (y/n): ")
        if confirm.lower() == "y":
            test_cancel_reservation(code)
    else:
        print("❌ Registration failed, stopping flow.")


if __name__ == "__main__":
    while True:
        choice = menu()

        if choice == "1":
            test_search_trips()
        elif choice == "2":
            test_register_and_reserve()
        elif choice == "3":
            test_reserve()
        elif choice == "4":
            test_get_reservation()
        elif choice == "5":
            test_cancel_reservation()
        elif choice == "6":
            full_flow_test()
        elif choice == "0":
            print("Bye!")
            break
        else:
            print("Invalid option, try again.")