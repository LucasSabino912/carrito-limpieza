import os
from fastapi import FastAPI
from dotenv import load_dotenv
from supabase import create_client, Client
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from datetime import date, datetime

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

# --- ESQUEMAS DE COMPRAS ---
class CompraCreate(BaseModel):
    concepto: str
    monto: float
    fecha: Optional[date] = None # Si no lo mandan, usamos el default de la DB

# --- ESQUEMAS DE VENTAS ---
class DetalleVentaCreate(BaseModel):
    producto_id: int
    cantidad: int
    precio_unitario: float

class VentaCreate(BaseModel):
    metodo_pago: str = "Efectivo"
    tipo_venta: str = "Mostrador"
    detalles: List[DetalleVentaCreate]

# --- ESQUEMA DE BALANCE ---
class BalanceResponse(BaseModel):
    ingresos: float
    gastos: float
    balance_total: float

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


# -- ENDPOINTS DE VENTAS --

# GET Ventas
@app.get("/ventas")
def listar_ventas():
    try: 
        query = supabase.table("ventas").select("*").order("created_at", desc=True).execute()
        return query.data
    except Exception as e:
        return {"status": "error", "message": str(e)}

# POST Ventas
@app.post("/ventas")
def crear_venta(venta: VentaCreate):
    try:
        # 1. Calcular el total de la venta sumando los subtotales de los detalles
        total_calculado = sum(d.cantidad * d.precio_unitario for d in venta.detalles)

        # 2. Insertar la cabecera en la tabla 'ventas'
        # No mandamos fecha porque Supabase usa el default (now())
        res = supabase.table("ventas").insert({
            "total": total_calculado,
            "metodo_pago": venta.metodo_pago,
            "tipo_venta": venta.tipo_venta
        }).execute()

        if not res.data:
            raise Exception("No se pudo crear la cabecera de la venta")

        venta_id = res.data[0]["id"]

        for item in venta.detalles:
            subtotal_item = item.cantidad * item.precio_unitario

            # A. Insertar el renglón del detalle
            supabase.table("detalle_ventas").insert({
                "venta_id": venta_id,
                "producto_id": item.producto_id,
                "cantidad": item.cantidad,
                "precio_unitario": item.precio_unitario,
                "subtotal": subtotal_item
            }).execute()

            # B. DESCUENTO DE STOCK AUTOMÁTICO
            # Primero buscamos cuánto hay ahora
            prod_query = supabase.table("productos").select("stock").eq("id", item.producto_id).execute()
            
            if prod_query.data:
                stock_actual = prod_query.data[0]["stock"]
                # Restamos y nos aseguramos de no quedar en negativo (mínimo 0)
                nuevo_stock = max(0, stock_actual - item.cantidad)

                # Actualizamos la tabla productos
                supabase.table("productos").update({"stock": nuevo_stock}).eq("id", item.producto_id).execute()

        return {
            "status": "success", 
            "message": "Venta registrada y stock actualizado", 
            "venta_id": venta_id,
            "total": total_calculado
        }

    except Exception as e:
        return {"status": "error", "message": f"Error crítico: {str(e)}"}