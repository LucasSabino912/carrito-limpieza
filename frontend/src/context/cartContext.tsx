'use client'
import { createContext, useContext, useState, ReactNode } from 'react'

interface Producto {
  id: number
  nombre: string
  precio: number
  imagen_url: string
  stock: number
  categoria?: string
  created_at?: string
}

interface CartItem extends Producto {
  cantidad: number
}

interface CartContextType {
  cart: CartItem[]
  addToCart: (product: Producto) => void
  removeFromCart: (id: number) => void
  updateQuantity: (id: number, cantidad: number) => void
  clearCart: () => void
  total: number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([])

  const addToCart = (product: Producto) => {
    setCart(prev => {
      const exists = prev.find(item => item.id === product.id)
      
      if (exists) {
        // CHEQUEO DE STOCK: Si ya alcanzó el límite, no suma más
        if (exists.cantidad >= product.stock) {
          alert(`¡Ups! Solo hay ${product.stock} unidades de ${product.nombre} en stock.`)
          return prev
        }
        return prev.map(item => 
          item.id === product.id ? { ...item, cantidad: item.cantidad + 1 } : item
        )
      }
      
      // CHEQUEO DE STOCK: Si no hay nada de stock, no lo deja agregar el primero
      if (product.stock <= 0) {
        alert(`¡No hay stock de ${product.nombre}!`)
        return prev
      }
      
      return [...prev, { ...product, cantidad: 1 }]
    })
  }

  const removeFromCart = (id: number) => {
    setCart(prev => prev.filter(item => item.id !== id))
  }

  const updateQuantity = (id: number, cantidad: number) => {
    if (cantidad <= 0) {
      removeFromCart(id)
      return
    }
    
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        // CHEQUEO DE STOCK EN LOS BOTONCITOS + y -
        if (cantidad > item.stock) {
          return { ...item, cantidad: item.stock } // Lo topamos al máximo disponible
        }
        return { ...item, cantidad }
      }
      return item
    }))
  }

  const clearCart = () => setCart([])

  const total = cart.reduce((acc, item) => acc + (item.precio * item.cantidad), 0)

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, total }}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart debe usarse dentro de un CartProvider')
  }
  return context
}