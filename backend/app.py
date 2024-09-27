# main.py
from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
import asyncio
import aiosqlite
import os
from datetime import datetime
import uuid

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React app's address
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure the uploads directory exists
os.makedirs("uploads", exist_ok=True)

def get_unique_filename(original_filename):
    base, extension = os.path.splitext(original_filename)
    counter = 1
    new_filename = original_filename
    while os.path.exists(os.path.join("uploads", new_filename)):
        new_filename = f"{base}_{counter}{extension}"
        counter += 1
    return new_filename

async def save_to_database():
    async with aiosqlite.connect("files.db") as db:
        await db.execute("""
            CREATE TABLE IF NOT EXISTS files (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                original_filename TEXT,
                saved_filename TEXT,
                upload_time TIMESTAMP
            )
        """)
        
        files = os.listdir("uploads")
        for file in files:
            await db.execute(
                "INSERT INTO files (original_filename, saved_filename, upload_time) VALUES (?, ?, ?)",
                (file, file, datetime.now())
            )
        await db.commit()
        
        # Clean up the uploads folder
        for file in files:
            os.remove(os.path.join("uploads", file))

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    print(f">>>> File save to db")
    await websocket.accept()
    try:
        filename_data = await websocket.receive_text()
        original_filename = filename_data.split(':', 1)[1]  # Extract filename from the received data
        unique_filename = get_unique_filename(original_filename)
        file_path = f"uploads/{unique_filename}"
        
        with open(file_path, "wb") as f:
            while True:
                data = await websocket.receive_bytes()
                if not data:
                    break
                f.write(data)
        
        # Save file info to database
        async with aiosqlite.connect("files.db") as db:
            await db.execute(
                "INSERT INTO files (original_filename, saved_filename, upload_time) VALUES (?, ?, ?)",
                (original_filename, unique_filename, datetime.now())
            )
            await db.commit()
        
        await websocket.send_text(f"File {original_filename} uploaded successfully as {unique_filename}")
    except Exception as e:
        await websocket.send_text(f"Error: {str(e)}")
    finally:
        await websocket.close()

@app.get("/files")
async def get_files():
    async with aiosqlite.connect("files.db") as db:
        db.row_factory = aiosqlite.Row
        async with db.execute("SELECT * FROM files ORDER BY upload_time DESC") as cursor:
            files = await cursor.fetchall()
            return [dict(file) for file in files]

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(periodic_save())

async def periodic_save():
    while True:
        await asyncio.sleep(60)  # Wait for 1 minute
        await save_to_database()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)