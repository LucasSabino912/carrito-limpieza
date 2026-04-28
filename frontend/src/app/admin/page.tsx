'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function AdminPage() {
  const [nombre, setNombre] = useState('')
  const [precio, setPrecio] = useState('')
  const [stock, setStock] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [cargando, setCargando] = useState(false)

  // Usamos la variable de entorno con el fallback local
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'

  const handleGuardar = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!file || !nombre || !precio) return alert('Completá todos los campos, fiera')
    
    setCargando(true)
    try {
      // 1. Subir la foto al Storage de Supabase
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random()}.${fileExt}`
      
      const { data: storageData, error: storageError } = await supabase.storage
        .from('productos-fotos')
        .upload(fileName, file)

      if (storageError) throw storageError

      // 2. Pedirle a Supabase la URL pública
      const { data: publicUrlData } = supabase.storage
        .from('productos-fotos')
        .getPublicUrl(fileName)

      const imgUrl = publicUrlData.publicUrl

      // 3. Mandar al Backend usando la variable de entorno
      const res = await fetch(`${API_URL}/productos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre,
          precio: parseFloat(precio),
          stock: parseInt(stock) || 0,
          imagen_url: imgUrl,
          categoria: "Limpieza"
        })
      })

      if (res.ok) {
        alert('¡Producto guardado de una!')
        setNombre(''); setPrecio(''); setStock(''); setFile(null)
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
    <div className="p-10 max-w-lg mx-auto bg-white shadow-2xl rounded-xl mt-10 border border-gray-200">
      <h1 className="text-3xl font-bold mb-8 text-blue-700 text-center">Panel de Carga</h1>
      
      <form onSubmit={handleGuardar} className="space-y-6">
        <div>
          {/* text-gray-900 es casi negro para que resalte */}
          <label className="block text-sm font-bold text-gray-900 mb-2 uppercase tracking-wide">
            Nombre del Producto
          </label>
          <input 
            className="w-full border-gray-300 border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900" 
            type="text" 
            value={nombre} 
            onChange={e => setNombre(e.target.value)} 
            placeholder="Ej: Detergente 5L" 
          />
        </div>
        
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-bold text-gray-900 mb-2 uppercase tracking-wide">
              Precio
            </label>
            <input 
              className="w-full border-gray-300 border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900" 
              type="number" 
              value={precio} 
              onChange={e => setPrecio(e.target.value)} 
              placeholder="0.00" 
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-bold text-gray-900 mb-2 uppercase tracking-wide">
              Stock
            </label>
            <input 
              className="w-full border-gray-300 border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900" 
              type="number" 
              value={stock} 
              onChange={e => setStock(e.target.value)} 
              placeholder="10" 
            />
          </div>
        </div>

        <div className="border-2 border-dashed border-blue-200 p-6 text-center rounded-lg bg-blue-50">
          <label className="block text-sm font-bold text-blue-900 mb-3 uppercase">
            Foto del Producto
          </label>
          <input 
            className="text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
            type="file" 
            onChange={e => setFile(e.target.files?.[0] || null)} 
          />
        </div>

        <button 
          type="submit" 
          disabled={cargando}
          className={`w-full py-4 rounded-lg font-black text-white text-lg shadow-md transition-all ${
            cargando ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 hover:shadow-lg active:scale-95'
          }`}
        >
          {cargando ? 'GUARDANDO EN DB...' : '🚀 SUBIR PRODUCTO'}
        </button>
      </form>
    </div>
  )
}