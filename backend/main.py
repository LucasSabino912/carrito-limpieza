import os
from fastapi import FastAPI
from dotenv import load_dotenv
from supabase import create_client, Client
from fastapi.middleware.cors import CORSMiddleware
# --- AGREGADO: Importamos BaseModel ---
from pydantic import BaseModel 

load_dotenv()

# --- AGREGADO: Definimos el modelo de datos ANTES de las rutas ---
class ProductoCreate(BaseModel):
    nombre: str
    precio: float
    stock: int
    imagen_url: str | None = None
    categoria: str | None = "Limpieza"

# 1. Primero creamos la App
app = FastAPI(title="API Mayorista de Limpieza")

# 2. Después configuramos CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. Inicializamos Supabase
url = os.environ.get("SUPABASE_URL", "").strip()
key = os.environ.get("SUPABASE_KEY", "").strip()
supabase: Client = create_client(url, key)

@app.get("/")
def home():
    return {"mensaje": "Backend conectado y funcionando"}

@app.get("/productos")
def listar_productos():
    try:
        query = supabase.table("productos").select("*").execute()
        return query.data
    except Exception as e:
        return {"error": str(e)}

@app.post("/productos")
def crear_producto(item: ProductoCreate): 
    try:
        # .model_dump() convierte el objeto de Pydantic a un diccionario
        res = supabase.table("productos").insert(item.model_dump()).execute()
        return {"status": "success", "data": res.data}
    except Exception as e:
        return {"status": "error", "message": str(e)}