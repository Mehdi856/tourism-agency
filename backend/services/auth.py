import bcrypt
from db.supabase import supabase



def authenticate_user(username: str, password: str) -> bool:
    response =supabase.table("admin").select("password").eq("username", username).execute()
    if not response.data:
        return False
    stored_password = response.data[0]["password"]
    return bcrypt.checkpw(password.encode('utf-8'), stored_password)



print(authenticate_user("admin", "admin123"))