import os
from dotenv import load_dotenv
from supabase import create_client, Client
import json
import time
import random
import string

load_dotenv(dotenv_path='backend/.env')

url: str = os.getenv("SUPABASE_URL") or "http://localhost:8000"
key: str = os.getenv("SUPABASE_KEY") or "None"
supabase: Client = create_client(url, key)

def generate_random_data(num_entries=20):
    data = []
    for _ in range(num_entries):
        title = ''.join(random.choices(string.ascii_letters + string.digits, k=10))
        content = ''.join(random.choices(string.ascii_letters + string.digits, k=50))
        data.append({"Title": title, "Content": content})
    return json.dumps(data)

random_data = generate_random_data()

for entry in json.loads(random_data):
    response = (
        supabase.table("Posts")
        .insert(entry)
        .execute()
    )
    time.sleep(1)
