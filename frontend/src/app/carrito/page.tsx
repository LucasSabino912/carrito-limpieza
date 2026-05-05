'use client'
import { useCart } from '../../context/cartContext'
import Link from 'next/link'

export default function CarritoPage() {
  const { cart, removeFromCart, updateQuantity, clearCart, total } = useCart()

  // 📱 LÓGICA PARA WHATSAPP
  const enviarPedidoWhatsApp = () => {
    // CAMBIÁ ESTE NÚMERO por el tuyo (con código de país, ej Argentina: 549 + tu numero)
    const numeroWhatsApp = "5493510000000" 
    
    // Armamos el texto del mensaje
    let texto = "👋 *Hola, quiero hacer un pedido para La Gotita Mayorista:*\n\n"
    
    cart.forEach(item => {
      texto += `▪️ ${item.cantidad}x *${item.nombre}* - $${item.precio * item.cantidad}\n`
    })
    
    texto += `\n💰 *Total Estimado: $${total}*\n\nPor favor, confirmame si hay stock de todo. ¡Gracias!`

    // Convertimos el texto a formato URL para que no se rompan los espacios y saltos de línea
    const mensajeUrl = encodeURIComponent(texto)
    const linkWhatsapp = `https://wa.me/${numeroWhatsApp}?text=${mensajeUrl}`
    
    // Abrimos WhatsApp en una pestaña nueva
    window.open(linkWhatsapp, '_blank')
  }

  return (
    <main className="min-h-screen bg-gray-50 p-4 sm:p-6 pb-20">
      <div className="max-w-4xl mx-auto">
        
        {/* ENCABEZADO */}
        <header className="flex items-center justify-between bg-white p-4 sm:p-6 rounded-xl shadow-sm mb-6">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-blue-800">Mi Carrito 🛒</h1>
          <Link href="/" className="text-blue-600 font-bold hover:underline">
            ← Volver al catálogo
          </Link>
        </header>

        {cart.length === 0 ? (
          /* CARRITO VACÍO */
          <div className="bg-white p-10 rounded-xl shadow-sm text-center border border-gray-200">
            <p className="text-5xl mb-4">🥲</p>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Tu carrito está vacío</h2>
            <p className="text-gray-500 mb-6">Parece que todavía no agregaste nada de limpieza.</p>
            <Link href="/" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-bold transition-all shadow-md inline-block">
              Ir a comprar
            </Link>
          </div>
        ) : (
          /* CARRITO CON COSAS */
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Lista de productos */}
            <ul className="divide-y divide-gray-200">
              {cart.map(item => (
                <li key={item.id} className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 hover:bg-gray-50 transition-colors">
                  
                  {/* Imagen y Nombre */}
                  <div className="flex items-center gap-4 flex-1 w-full">
                    <img src={item.imagen_url || 'https://via.placeholder.com/80'} alt={item.nombre} className="w-16 h-16 sm:w-20 sm:h-20 object-contain rounded-lg bg-white border" />
                    <div>
                      <h3 className="font-bold text-gray-800 text-lg">{item.nombre}</h3>
                      <p className="text-sm text-gray-500 font-medium">Precio unitario: ${item.precio}</p>
                    </div>
                  </div>

                  {/* Controles de Cantidad y Precio Total */}
                  <div className="flex items-center justify-between w-full sm:w-auto gap-6 sm:gap-8 mt-2 sm:mt-0">
                    
                    {/* Botones de + y - */}
                    <div className="flex items-center bg-gray-100 rounded-lg p-1 border border-gray-300">
                      <button onClick={() => updateQuantity(item.id, item.cantidad - 1)} className="w-8 h-8 flex items-center justify-center font-black text-gray-600 hover:bg-gray-200 rounded-md transition-colors">-</button>
                      <span className="w-10 text-center font-bold text-gray-800">{item.cantidad}</span>
                      <button onClick={() => updateQuantity(item.id, item.cantidad + 1)} className="w-8 h-8 flex items-center justify-center font-black text-gray-600 hover:bg-gray-200 rounded-md transition-colors">+</button>
                    </div>

                    {/* Subtotal del item */}
                    <div className="text-right min-w-[80px]">
                      <p className="font-black text-green-600 text-xl">${item.precio * item.cantidad}</p>
                    </div>

                    {/* Botón tachito de basura */}
                    <button onClick={() => removeFromCart(item.id)} className="text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 p-2 rounded-lg transition-colors" title="Eliminar producto">
                      🗑️
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            {/* ZONA DE TOTALES Y BOTONES */}
            <div className="p-6 bg-gray-50 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
                <button onClick={clearCart} className="text-red-600 font-bold hover:underline text-sm">
                  Vaciar carrito completo
                </button>
                <div className="text-right">
                  <p className="text-gray-500 font-bold uppercase tracking-wide text-sm mb-1">Total a pagar</p>
                  <p className="text-4xl font-black text-green-600">${total}</p>
                </div>
              </div>

              <button 
                onClick={enviarPedidoWhatsApp}
                className="w-full bg-green-500 hover:bg-green-600 text-white font-black py-4 rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-3 text-lg"
              >
                <span>💬</span> Enviar Pedido por WhatsApp
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}