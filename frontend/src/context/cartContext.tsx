'use client'
import { createContext, useContext, useState, ReactNode } from 'react'

// 1. Definimos la estructura de tu producto (igual a la base de datos)
interface Producto {
  id: number
  nombre: string
  precio: number
  imagen_url: string
  stock: number
  created_at?: string
}

// 2. Definimos cómo es un ítem dentro del carrito (Producto + cantidad)
interface CartItem extends Producto {
  cantidad: number
}

// 3. Definimos todo lo que el contexto va a exportar
interface CartContextType {
  cart: CartItem[]
  addToCart: (product: Producto) => void
  removeFromCart: (id: number) => void
  clearCart: () => void
  total: number
}

// Creamos el contexto vacío
const CartContext = createContext<CartContextType | undefined>(undefined)

// 4. Creamos el Provider (el componente que envuelve a tu app)
export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([])

  // Función para agregar o sumar cantidad si ya existe
  const addToCart = (product: Producto) => {
    setCart(prev => {
      const exists = prev.find(item => item.id === product.id)
      if (exists) {
        // Si ya está en el carrito, le sumamos 1 a la cantidad
        return prev.map(item => 
          item.id === product.id ? { ...item, cantidad: item.cantidad + 1 } : item
        )
      }
      // Si no está, lo agregamos con cantidad 1
      return [...prev, { ...product, cantidad: 1 }]
    })
  }

  // Función para borrar un producto del carrito
  const removeFromCart = (id: number) => {
    setCart(prev => prev.filter(item => item.id !== id))
  }

  // Función para vaciar todo el carrito (ideal para cuando se envía el pedido)
  const clearCart = () => setCart([])

  // Calculamos el costo total automáticamente
  const total = cart.reduce((acc, item) => acc + (item.precio * item.cantidad), 0)

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, clearCart, total }}>
      {children}
    </CartContext.Provider>
  )
}

// 5. Hook personalizado para usar el carrito fácil en cualquier lado
export const useCart = () => {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart debe usarse dentro de un CartProvider')
  }
  return context
}