'use client'
import { useEffect, useState } from 'react'

interface Producto {
  id: number
  nombre: string
  precio: number
  imagen_url: string
  stock: number
}

export default function CatalogoPAge() {
  const [productos, setProductos] = useState<Producto[]>([])
  const [loading, setLoading] = useState(true)

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'

  useEffect(() => {
    fetch(`${API_URL}/productos`)
      .then(res => {
        if (!res.ok) throw new Error('Error al cargar productos')
          return res.json()
      })
      .then(data => {
        setProductos(data)
        setLoading(false)
      })
      .catch(err => {
        console.error('Error: cargando productos', err)
        setLoading(false)
      })
  }, [API_URL])

  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <p className="text-xl font-bold text-blue-600 animate-pulse">Cargando catalogo...</p>
    </div>
  )

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <header className="max-w-6xl mx-auto mb-10 flex justify-between items-center bg-white p-4 rounded-xl shadow-sm">
        <h1 className="text-3xl font-extrabold text-blue-800">Mayorista Limpieza</h1>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full font-bold transition flex items-center gap-2">
          <span>🛒</span>
          <span>Carrito (0)</span>
        </button>
      </header>

      {productos.length === 0 ? (
        <p className="text-center text-gray-500">No hay productos disponibles por ahora.</p>
      ) : (
        <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {productos.map((prod) => (
            <div key={prod.id} className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 p-4 border border-gray-100 flex flex-col">
              <div className="h-48 w-full relative mb-4">
                <img 
                  src={prod.imagen_url || 'https://via.placeholder.com/150'} 
                  alt={prod.nombre} 
                  className="w-full h-full object-contain rounded-lg"
                />
              </div>
              <h2 className="text-lg font-bold text-gray-800 mb-1">{prod.nombre}</h2>
              <p className="text-sm text-gray-500">Stock: {prod.stock} unid.</p>
              <div className="mt-auto">
                <p className="text-2xl font-black text-green-600 my-3">${prod.precio}</p>
                <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg transition-colors">
                  Agregar al carrito
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  )

}