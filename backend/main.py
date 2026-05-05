import os
from fastapi import FastAPI
from dotenv import load_dotenv
from supabase import create_client, Client
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional

load_dotenv()

# --- Definimos los modelos de datos ---
class ProductoCreate(BaseModel):
    nombre: str
    precio: float
    stock: int
    imagen_url: Optional[str] = None
    created_at: Optional[str] = None
    categoria: str

# Modelo para actualizar (no pedimos imagen ni created_at porque eso no se edita acá)
class ProductoUpdate(BaseModel):
    nombre: str
    precio: float
    stock: int
    categoria: str

# 1. Creamos la App
app = FastAPI(title="API Mayorista de Limpieza")

# 2. Configuramos CORS
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
        # exclude_none=True evita mandar "created_at": null a Supabase
        res = supabase.table("productos").insert(item.model_dump(exclude_none=True)).execute()
        return {"status": "success", "data": res.data}
    except Exception as e:
        return {"status": "error", "message": str(e)}

# ENDPOINT PARA EDITAR TODO EL PRODUCTO
@app.put("/productos/{id}")
def editar_producto(id: int, item: ProductoUpdate):
    try:
        res = supabase.table("productos").update(item.model_dump()).eq("id", id).execute()
        return {"status": "success", "data": res.data}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.delete("/productos/{id}")
def borrar_producto(id: int):
    try:
        res = supabase.table("productos").delete().eq("id", id).execute()
        return {"status": "success", "data": res.data}
    except Exception as e:
        return {"status": "error", "message": str(e)}

# Estos los dejamos por las dudas si después querés hacer un botón rápido de stock
@app.patch("/productos/{id}/stock")
def cambiar_stock(id: int, nuevo_stock: int):
    try:
        res = supabase.table("productos").update({"stock": nuevo_stock}).eq("id", id).execute()
        return {"status": "success", "data": res.data}
    except Exception as e:
        return {"status": "error", "message": str(e)}
    
@app.patch("/productos/{id}/precio")
def cambiar_precio(id: int, nuevo_precio: float):
    try:
        res = supabase.table("productos").update({"precio": nuevo_precio}).eq("id", id).execute()
        return {"status": "success", "data": res.data}
    except Exception as e:
        return {"status": "error", "message": str(e)}