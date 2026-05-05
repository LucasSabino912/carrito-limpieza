'use client'
import { useState, useRef, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface Producto {
  id: number
  nombre: string
  precio: number
  stock: number
  categoria: string
}

export default function AdminPage() {
  // --- ESTADOS DE AUTENTICACIÓN ---
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [verificando, setVerificando] = useState(true)
  const [usuarioInput, setUsuarioInput] = useState('')
  const [passwordInput, setPasswordInput] = useState('')
  const [errorLogin, setErrorLogin] = useState('')

  // --- ESTADOS DEL PANEL ---
  const [vista, setVista] = useState<'cargar' | 'eliminar'>('cargar')
  const [nombre, setNombre] = useState('')
  const [precio, setPrecio] = useState('')
  const [stock, setStock] = useState('')
  const [categoria, setCategoria] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [cargando, setCargando] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [productos, setProductos] = useState<Producto[]>([])
  const [categoriasExistentes, setCategoriasExistentes] = useState<string[]>([])
  const [cargandoLista, setCargandoLista] = useState(false)
  const [productoAEditar, setProductoAEditar] = useState<Producto | null>(null)

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'

  // CREDENCIALES DEL .ENV
  const ADMIN_USER = process.env.NEXT_PUBLIC_ADMIN_USER?.trim() || ''
  const ADMIN_PASS = process.env.NEXT_PUBLIC_ADMIN_PASS?.trim() || ''

  // 1. CHEQUEAR SI YA ESTÁ LOGUEADO AL ENTRAR
  useEffect(() => {
    const authStatus = sessionStorage.getItem('adminAutenticado')
    if (authStatus === 'true') {
      setIsLoggedIn(true)
    }
    setVerificando(false)
  }, [])

  // 2. FUNCIÓN DE LOGIN
  const handleLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (usuarioInput.trim() === ADMIN_USER && passwordInput.trim() === ADMIN_PASS) {
      sessionStorage.setItem('adminAutenticado', 'true')
      setIsLoggedIn(true)
    } else {
      setErrorLogin('Usuario o contraseña incorrectos ❌')
      setPasswordInput('')
    }
  }

  // --- LOGICA DE PRODUCTOS (Solo se ejecuta si está logueado) ---
  useEffect(() => {
    if (isLoggedIn && vista === 'eliminar') {
      fetchProductos()
    }
  }, [vista, isLoggedIn])

  const fetchProductos = async () => {
    setCargandoLista(true)
    try {
      const res = await fetch(`${API_URL}/productos`, { cache: 'no-store' })
      if (!res.ok) throw new Error('Error al traer productos')
      const data = await res.json()
      setProductos(data)
      const categoriasUnicas = Array.from(new Set(data.map((p: any) => p.categoria || 'General')))
      setCategoriasExistentes(categoriasUnicas as string[])
    } catch (error) {
      console.error(error)
    } finally {
      setCargandoLista(false)
    }
  }

  const handleEliminar = async (id: number, nombreProd: string) => {
    const confirmado = window.confirm(`¿Estás seguro que querés borrar "${nombreProd}"?`)
    if (!confirmado) return
    try {
      const res = await fetch(`${API_URL}/productos/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (res.ok && data.status === 'success') {
        setProductos(productos.filter(p => p.id !== id))
        alert('¡Producto eliminado correctamente!')
      } else {
        alert(`Falla en el backend al borrar: ${data.message}`)
      }
    } catch (error) {
      console.error(error)
      alert('Error de conexión al intentar eliminar')
    }
  }

  const handleGuardarEdicion = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!productoAEditar) return
    try {
      const res = await fetch(`${API_URL}/productos/${productoAEditar.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: productoAEditar.nombre,
          precio: parseFloat(productoAEditar.precio.toString()),
          stock: parseInt(productoAEditar.stock.toString()),
          categoria: productoAEditar.categoria || 'General'
        })
      })
      const data = await res.json()
      if (res.ok && data.status === 'success') {
        setProductos(productos.map(p => p.id === productoAEditar.id ? productoAEditar : p))
        setProductoAEditar(null)
        alert('¡Producto actualizado!')
      } else {
        alert(`Error al editar: ${data.message}`)
      }
    } catch (error) {
      console.error(error)
      alert('Error de conexión al guardar edición')
    }
  }

  const handleGuardar = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!file || !nombre || !precio || !categoria) return alert('Completá todos los campos')
    setCargando(true)
    try {
      const safeFileName = file.name.replace(/[^a-zA-Z0-9.]/g, '_')
      const fileName = `${Date.now()}-${safeFileName}`
      const { error: storageError } = await supabase.storage.from('productos-fotos').upload(fileName, file)
      if (storageError) throw storageError
      const { data: publicUrlData } = supabase.storage.from('productos-fotos').getPublicUrl(fileName)
      const imgUrl = publicUrlData.publicUrl

      const res = await fetch(`${API_URL}/productos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre, precio: parseFloat(precio), stock: parseInt(stock) || 0, imagen_url: imgUrl, categoria: categoria
        })
      })
      const data = await res.json()
      if (res.ok && data.status === 'success') {
        alert('¡Producto guardado de una!')
        setNombre(''); setPrecio(''); setStock(''); setCategoria(''); setFile(null)
        if (fileInputRef.current) fileInputRef.current.value = ''
      } else {
        alert(`Error al guardar: ${data.message}`)
      }
    } catch (error) {
      console.error(error)
      alert('Error crítico en la carga')
    } finally {
      setCargando(false)
    }
  }

  // --- RENDER 1: PANTALLA DE CARGA INICIAL ---
  if (verificando) return (
    <div className="h-screen flex items-center justify-center bg-gray-50">
      <p className="font-bold text-gray-500 animate-pulse">Verificando acceso...</p>
    </div>
  )

  // --- RENDER 2: PANTALLA DE LOGIN (Si no está logueado) ---
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-sm border border-gray-200">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-black mt-4 text-gray-900">Acceso Restringido</h1>
            <p className="text-gray-500 text-sm">Ingresá tus credenciales para continuar</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Usuario</label>
              <input type="text" className="w-full border p-3 rounded-lg text-gray-900 focus:ring-2 focus:ring-gray-800 outline-none" value={usuarioInput} onChange={e => setUsuarioInput(e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Contraseña</label>
              <input type="password" className="w-full border p-3 rounded-lg text-gray-900 focus:ring-2 focus:ring-gray-800 outline-none" value={passwordInput} onChange={e => setPasswordInput(e.target.value)} required />
            </div>
            {errorLogin && <p className="text-red-500 text-sm font-bold text-center bg-red-50 p-2 rounded">{errorLogin}</p>}
            <button type="submit" className="w-full bg-gray-900 hover:bg-black text-white py-3 rounded-lg font-bold shadow-md transition-all">
              Ingresar al Panel
            </button>
          </form>
        </div>
      </div>
    )
  }

  // --- RENDER 3: PANEL DE ADMINISTRACIÓN (El que ya teníamos) ---
  return (
    <div className="p-4 sm:p-10 max-w-4xl mx-auto bg-white shadow-2xl rounded-xl mt-6 sm:mt-10 border border-gray-200 min-h-[500px] relative mb-20">
      
      {/* Botón para cerrar sesión */}
      <button 
        onClick={() => {
          sessionStorage.removeItem('adminAutenticado')
          setIsLoggedIn(false)
        }} 
        className="absolute top-4 right-4 sm:top-6 sm:right-6 text-sm font-bold text-red-500 hover:text-red-700 hover:underline"
      >
        Cerrar Sesión
      </button>

      <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-blue-700 text-center">Panel de Administración</h1>
      
      <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 mb-8">
        <button onClick={() => setVista('cargar')} className={`w-full sm:w-auto px-6 py-3 sm:py-2 rounded-lg font-bold transition-all ${vista === 'cargar' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
          Cargar Producto
        </button>
        <button onClick={() => setVista('eliminar')} className={`w-full sm:w-auto px-6 py-3 sm:py-2 rounded-lg font-bold transition-all ${vista === 'eliminar' ? 'bg-red-600 text-white shadow-md' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
          Gestionar Catálogo
        </button>
      </div>

      {vista === 'cargar' && (
        <form onSubmit={handleGuardar} className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-[2]">
              <label className="block text-sm font-bold text-gray-900 mb-2 uppercase tracking-wide">Nombre del Producto</label>
              <input className="w-full border-gray-300 border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900" type="text" value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej: Detergente 5L" />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-bold text-gray-900 mb-2 uppercase tracking-wide">Categoría</label>
              <input list="lista-categorias" className="w-full border-gray-300 border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900" value={categoria} onChange={e => setCategoria(e.target.value)} placeholder="Ej: Limpieza" />
              <datalist id="lista-categorias">
                {categoriasExistentes.map(cat => <option key={cat} value={cat} />)}
              </datalist>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-bold text-gray-900 mb-2 uppercase tracking-wide">Precio</label>
              <input className="w-full border-gray-300 border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900" type="number" value={precio} onChange={e => setPrecio(e.target.value)} placeholder="0.00" />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-bold text-gray-900 mb-2 uppercase tracking-wide">Stock</label>
              <input className="w-full border-gray-300 border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900" type="number" value={stock} onChange={e => setStock(e.target.value)} placeholder="10" />
            </div>
          </div>

          <div className="border-2 border-dashed border-blue-200 p-4 sm:p-6 text-center rounded-lg bg-blue-50 overflow-hidden">
            <label className="block text-sm font-bold text-blue-900 mb-3 uppercase">Foto del Producto</label>
            <input ref={fileInputRef} className="w-full text-xs sm:text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700" type="file" onChange={e => setFile(e.target.files?.[0] || null)} />
          </div>

          <button type="submit" disabled={cargando} className={`w-full py-4 rounded-lg font-black text-white text-lg shadow-md transition-all ${cargando ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}>
            {cargando ? 'GUARDANDO...' : 'SUBIR PRODUCTO'}
          </button>
        </form>
      )}

      {vista === 'eliminar' && (
        <div>
          {cargandoLista ? (
            <p className="text-center text-gray-500 py-10 font-bold animate-pulse">Cargando catálogo...</p>
          ) : productos.length === 0 ? (
            <p className="text-center text-gray-500 py-10">No hay productos cargados.</p>
          ) : (
            <ul className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
              {productos.map(prod => (
                <li key={prod.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 bg-gray-50 p-4 rounded-lg border border-gray-200 hover:shadow-sm transition-all">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-gray-800 break-words">{prod.nombre}</p>
                      <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full font-semibold">{prod.categoria || 'Sin categoría'}</span>
                    </div>
                    <p className="text-sm text-green-600 font-black">${prod.precio} <span className="text-gray-400 font-normal ml-2">Stock: {prod.stock}</span></p>
                  </div>
                  <div className="flex w-full sm:w-auto gap-2">
                    <button onClick={() => setProductoAEditar(prod)} className="flex-1 sm:flex-none bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg font-bold transition-colors shadow-sm">
                      Editar
                    </button>
                    <button onClick={() => handleEliminar(prod.id, prod.nombre)} className="flex-1 sm:flex-none bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-bold transition-colors shadow-sm">
                      Borrar
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {productoAEditar && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 sm:p-8 rounded-xl shadow-2xl w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 border-b pb-2">Editar Producto</h2>
            <form onSubmit={handleGuardarEdicion} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Nombre</label>
                <input className="w-full border p-2 rounded text-gray-900 focus:ring-2 focus:ring-yellow-500 outline-none" type="text" value={productoAEditar.nombre} onChange={e => setProductoAEditar({...productoAEditar, nombre: e.target.value})} required />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Categoría</label>
                <input list="lista-categorias-edit" className="w-full border p-2 rounded text-gray-900 focus:ring-2 focus:ring-yellow-500 outline-none" type="text" value={productoAEditar.categoria || ''} onChange={e => setProductoAEditar({...productoAEditar, categoria: e.target.value})} required />
                <datalist id="lista-categorias-edit">
                  {categoriasExistentes.map(cat => <option key={cat} value={cat} />)}
                </datalist>
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-bold text-gray-700 mb-1">Precio</label>
                  <input className="w-full border p-2 rounded text-gray-900 focus:ring-2 focus:ring-yellow-500 outline-none" type="number" value={Number.isNaN(productoAEditar.precio) ? '' : productoAEditar.precio} onChange={e => setProductoAEditar({...productoAEditar, precio: parseFloat(e.target.value)})} required />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-bold text-gray-700 mb-1">Stock</label>
                  <input className="w-full border p-2 rounded text-gray-900 focus:ring-2 focus:ring-yellow-500 outline-none" type="number" value={Number.isNaN(productoAEditar.stock) ? '' : productoAEditar.stock} onChange={e => setProductoAEditar({...productoAEditar, stock: parseInt(e.target.value)})} required />
                </div>
              </div>
              <div className="flex gap-3 mt-6 pt-2">
                <button type="button" onClick={() => setProductoAEditar(null)} className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 rounded-lg font-bold transition-all">Cancelar</button>
                <button type="submit" className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white py-3 rounded-lg font-bold shadow-md transition-all">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}