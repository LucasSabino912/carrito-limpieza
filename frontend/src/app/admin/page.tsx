'use client'
import { useState, useRef, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface Producto {
  id: number
  nombre: string
  precio: number
  stock: number
}

export default function AdminPage() {
  // Estado para manejar qué vista mostramos
  const [vista, setVista] = useState<'cargar' | 'eliminar'>('cargar')

  // Estados del formulario de carga
  const [nombre, setNombre] = useState('')
  const [precio, setPrecio] = useState('')
  const [stock, setStock] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [cargando, setCargando] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Estados de la lista de eliminación
  const [productos, setProductos] = useState<Producto[]>([])
  const [cargandoLista, setCargandoLista] = useState(false)

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'

  // --- LÓGICA PARA ELIMINAR ---
  useEffect(() => {
    if (vista === 'eliminar') {
      fetchProductos()
    }
  }, [vista])

  const fetchProductos = async () => {
    setCargandoLista(true)
    try {
      const res = await fetch(`${API_URL}/productos`)
      if (!res.ok) throw new Error('Error al traer productos')
      const data = await res.json()
      setProductos(data)
    } catch (error) {
      console.error(error)
    } finally {
      setCargandoLista(false)
    }
  }

const handleEliminar = async (id: number, nombreProd: string) => {
    // RASTREADOR 1: Vemos si el botón al menos reacciona
    console.log("👉 1. Botón clickeado. ID a borrar:", id, "Nombre:", nombreProd)

    // RASTREADOR 2: Vemos si lanza la confirmación
    // La sacoasi el navegador no rompe las bolas
    // const confirmado = window.confirm(`¿Estás seguro que querés borrar "${nombreProd}"?`)
    // console.log("👉 2. Respuesta de la confirmación:", confirmado)

    /* if (!confirmado) {
      console.log("👉 3. Cancelaste el borrado (o el navegador lo bloqueó automático).")
      return
    }*/

    console.log("👉 4. Yendo a pegarle al backend...")
    try {
      const res = await fetch(`${API_URL}/productos/${id}`, {
        method: 'DELETE',
      })

      const data = await res.json()
      console.log("👉 5. Respuesta del backend al borrar:", data)

      if (res.ok && data.status === 'success') {
        setProductos(productos.filter(p => p.id !== id))
        alert('¡Producto eliminado correctamente!')
      } else {
        alert(`Falla en el backend: ${data.message || 'Mirá la consola'}`)
      }
    } catch (error) {
      console.error("🚨 Error crítico al borrar:", error)
      alert('Error de conexión al intentar eliminar')
    }
  }

  // --- LÓGICA PARA CARGAR ---
  const handleGuardar = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!file || !nombre || !precio) return alert('Completá todos los campos, fiera')
    
    setCargando(true)
    try {
      const safeFileName = file.name.replace(/[^a-zA-Z0-9.]/g, '_')
      const fileName = `${Date.now()}-${safeFileName}`
      
      const { error: storageError } = await supabase.storage
        .from('productos-fotos')
        .upload(fileName, file)

      if (storageError) throw storageError

      const { data: publicUrlData } = supabase.storage
        .from('productos-fotos')
        .getPublicUrl(fileName)

      const imgUrl = publicUrlData.publicUrl

      const res = await fetch(`${API_URL}/productos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre,
          precio: parseFloat(precio),
          stock: parseInt(stock) || 0,
          imagen_url: imgUrl
        })
      })

      if (res.ok) {
        alert('¡Producto guardado de una!')
        setNombre(''); setPrecio(''); setStock(''); setFile(null)
        if (fileInputRef.current) fileInputRef.current.value = ''
      } else {
        alert('El backend tiró error')
      }
    } catch (error) {
      console.error(error)
      alert('Error crítico en la carga')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="p-10 max-w-2xl mx-auto bg-white shadow-2xl rounded-xl mt-10 border border-gray-200 min-h-[500px]">
      <h1 className="text-3xl font-bold mb-6 text-blue-700 text-center">Panel de Administración</h1>
      
      {/* PESTAÑAS DE NAVEGACIÓN */}
      <div className="flex justify-center gap-4 mb-8">
        <button 
          onClick={() => setVista('cargar')}
          className={`px-6 py-2 rounded-lg font-bold transition-all ${
            vista === 'cargar' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
          }`}
        >
          Cargar Producto
        </button>
        <button 
          onClick={() => setVista('eliminar')}
          className={`px-6 py-2 rounded-lg font-bold transition-all ${
            vista === 'eliminar' ? 'bg-red-600 text-white shadow-md' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
          }`}
        >
          Gestionar Catálogo
        </button>
      </div>

      {/* VISTA 1: FORMULARIO DE CARGA */}
      {vista === 'cargar' && (
        <form onSubmit={handleGuardar} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2 uppercase tracking-wide">Nombre del Producto</label>
            <input className="w-full border-gray-300 border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900" type="text" value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej: Detergente 5L" />
          </div>
          
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-bold text-gray-900 mb-2 uppercase tracking-wide">Precio</label>
              <input className="w-full border-gray-300 border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900" type="number" value={precio} onChange={e => setPrecio(e.target.value)} placeholder="0.00" />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-bold text-gray-900 mb-2 uppercase tracking-wide">Stock</label>
              <input className="w-full border-gray-300 border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900" type="number" value={stock} onChange={e => setStock(e.target.value)} placeholder="10" />
            </div>
          </div>

          <div className="border-2 border-dashed border-blue-200 p-6 text-center rounded-lg bg-blue-50">
            <label className="block text-sm font-bold text-blue-900 mb-3 uppercase">Foto del Producto</label>
            <input ref={fileInputRef} className="text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700" type="file" onChange={e => setFile(e.target.files?.[0] || null)} />
          </div>

          <button type="submit" disabled={cargando} className={`w-full py-4 rounded-lg font-black text-white text-lg shadow-md transition-all ${cargando ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}>
            {cargando ? 'GUARDANDO...' : 'SUBIR PRODUCTO'}
          </button>
        </form>
      )}

      {/* VISTA 2: LISTA PARA ELIMINAR */}
      {vista === 'eliminar' && (
        <div>
          {cargandoLista ? (
            <p className="text-center text-gray-500 py-10 font-bold animate-pulse">Cargando catálogo...</p>
          ) : productos.length === 0 ? (
            <p className="text-center text-gray-500 py-10">No hay productos cargados.</p>
          ) : (
            <ul className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
              {productos.map(prod => (
                <li key={prod.id} className="flex justify-between items-center bg-gray-50 p-4 rounded-lg border border-gray-200 hover:shadow-sm transition-all">
                  <div>
                    <p className="font-bold text-gray-800">{prod.nombre}</p>
                    <p className="text-sm text-green-600 font-black">${prod.precio}</p>
                  </div>
                  <button 
                    onClick={() => handleEliminar(prod.id, prod.nombre)}
                    className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg font-bold transition-colors shadow-sm"
                    title="Eliminar producto"
                  >
                    Borrar
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}