'use client'
import { useEffect, useState } from 'react'
import { useCart } from '../context/cartContext'
import Link from 'next/link'

interface Producto {
  id: number
  nombre: string
  precio: number
  imagen_url: string
  stock: number
  categoria?: string
  created_at?: string
}

export default function CatalogoPage() {
  const [productos, setProductos] = useState<Producto[]>([])
  const [loading, setLoading] = useState(true)
  
  const [busqueda, setBusqueda] = useState('')
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('Todas')
  const [categorias, setCategorias] = useState<string[]>([])

  const { cart, addToCart } = useCart()
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'

  useEffect(() => {
    fetch(`${API_URL}/productos`, { cache: 'no-store' })
      .then(res => {
        if (!res.ok) throw new Error('Error al cargar productos')
          return res.json()
      })
      .then(data => {
        setProductos(data)
        const catsUnicas = Array.from(new Set(data.map((p: any) => p.categoria || 'General')))
        setCategorias(['Todas', ...(catsUnicas as string[])])
        setLoading(false)
      })
      .catch(err => {
        console.error('Error: cargando productos', err)
        setLoading(false)
      })
  }, [API_URL])

  const totalArticulos = cart.reduce((acc, item) => acc + item.cantidad, 0)

  const productosFiltrados = productos.filter(prod => {
    const coincideBusqueda = prod.nombre.toLowerCase().includes(busqueda.toLowerCase())
    const catProducto = prod.categoria || 'General'
    const coincideCategoria = categoriaSeleccionada === 'Todas' || catProducto === categoriaSeleccionada
    return coincideBusqueda && coincideCategoria
  })

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <p className="text-xl sm:text-2xl font-bold text-blue-600 animate-pulse">Cargando catálogo...</p>
    </div>
  )

  return (
    <main className="min-h-screen bg-gray-50 p-4 sm:p-6 relative">
      <header className="max-w-6xl mx-auto mb-6 flex flex-col sm:flex-row justify-between items-center bg-white p-4 sm:p-6 rounded-xl shadow-sm gap-4">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-blue-800 text-center sm:text-left">
          La Gotita Mayorista
        </h1>
        
        {/* Solo quedó el botón del carrito, bien limpio */}
        <Link href="/carrito" className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 sm:py-2 rounded-full font-bold transition flex items-center justify-center gap-2 shadow-md">
          <span className="text-xl">🛒</span>
          <span>Carrito ({totalArticulos})</span>
        </Link>
      </header>

      <section className="max-w-6xl mx-auto mb-8 bg-white p-4 sm:p-5 rounded-xl shadow-sm border border-gray-200">
        <div className="flex flex-col gap-4">
          <input 
            type="text" 
            placeholder="🔍 Buscar producto por nombre..." 
            className="w-full border border-gray-300 p-3 sm:p-4 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-800"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
          <details className="group border border-gray-200 rounded-lg overflow-hidden">
            <summary className="p-3 sm:p-4 font-bold cursor-pointer bg-gray-50 text-gray-700 hover:bg-gray-100 transition-colors flex justify-between items-center list-none select-none">
              <span className="flex items-center gap-2">
                <span>📁</span> Categoría: <span className="text-blue-600">{categoriaSeleccionada}</span>
              </span>
              <span className="transition-transform duration-300 group-open:rotate-180">▼</span>
            </summary>
            <div className="p-4 flex flex-wrap gap-2 border-t border-gray-200 bg-white">
              {categorias.map(cat => (
                <button 
                  key={cat}
                  onClick={() => setCategoriaSeleccionada(cat)}
                  className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
                    categoriaSeleccionada === cat 
                      ? 'bg-blue-600 text-white shadow-md scale-105' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </details>
        </div>
      </section>

      {productosFiltrados.length === 0 ? (
        <div className="text-center py-10 bg-white rounded-xl shadow-sm max-w-6xl mx-auto border border-gray-200">
          <p className="text-4xl mb-4">🕵️‍♂️</p>
          <p className="text-xl text-gray-500 font-bold">No encontramos productos con esos filtros.</p>
          <button 
            onClick={() => { setBusqueda(''); setCategoriaSeleccionada('Todas') }}
            className="mt-4 text-blue-600 font-bold hover:underline"
          >
            Limpiar búsqueda
          </button>
        </div>
      ) : (
        <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {productosFiltrados.map((prod) => (
            <div key={prod.id} className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 p-4 border border-gray-100 flex flex-col h-full">
              <div className="h-40 sm:h-48 w-full relative mb-4 bg-gray-50 rounded-lg p-2">
                <img 
                  src={prod.imagen_url || 'https://via.placeholder.com/150'} 
                  alt={prod.nombre} 
                  className="w-full h-full object-contain mix-blend-multiply"
                />
              </div>
              
              <div className="flex-1 flex flex-col">
                <span className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
                  {prod.categoria || 'General'}
                </span>
                
                <h2 className="text-lg font-bold text-gray-800 leading-tight mb-2">{prod.nombre}</h2>
                <p className="text-sm text-gray-500 mb-4">Stock: {prod.stock} unid.</p>
                
                <div className="mt-auto pt-4 border-t border-gray-100">
                  <p className="text-2xl sm:text-3xl font-black text-green-600 mb-4">${prod.precio}</p>
                  
                  <button 
                    onClick={() => addToCart(prod)}
                    disabled={prod.stock <= 0}
                    className={`w-full font-bold py-3 sm:py-2 rounded-lg transition-colors active:scale-95 shadow-sm ${
                      prod.stock <= 0 
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {prod.stock <= 0 ? 'Sin Stock' : 'Agregar al carrito'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}