'use client';

import { useCart } from "@/context/CartContext";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function CartPage() {
  const { cartItems, removeFromCart, cartTotal, clearCart } = useCart();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch by ensuring we only render on the client
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 gap-4">
        <h1 className="text-2xl font-bold">Your Cart is Empty</h1>
        <p className="text-gray-500">Looks like you haven't added anything yet.</p>
        <Link
          href="/"
          className="px-6 py-3 bg-black text-white rounded-md hover:bg-gray-800 transition-colors"
        >
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 sm:p-20">
      <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>

      <div className="flex flex-col lg:flex-row gap-12">
        {/* Cart Items List */}
        <div className="flex-1 flex flex-col gap-6">
          {cartItems.map((item) => (
            <div
              key={item.id}
              className="flex flex-col sm:flex-row items-center gap-6 border-b border-gray-200 pb-6"
            >
              {/* Image */}
              <div className="w-24 h-24 flex-shrink-0 bg-gray-100 rounded-md overflow-hidden">
                {item.images[0] ? (
                  <img
                    src={item.images[0].src}
                    alt={item.images[0].alt || item.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                    No Image
                  </div>
                )}
              </div>

              {/* Details */}
              <div className="flex-1 text-center sm:text-left">
                <h2 className="text-lg font-semibold">{item.name}</h2>
                <p className="text-gray-500">€{item.price}</p>
              </div>

              {/* Quantity */}
              <div className="flex items-center gap-2">
                <span className="text-gray-600">Qty: {item.quantity}</span>
              </div>

              {/* Remove Button */}
              <button
                onClick={() => removeFromCart(item.id)}
                className="text-red-500 hover:text-red-700 font-medium text-sm"
              >
                Remove
              </button>
            </div>
          ))}
          
          <button 
            onClick={clearCart}
            className="self-start text-gray-500 underline text-sm hover:text-black mt-2"
          >
            Clear Cart
          </button>
        </div>

        {/* Summary Section */}
        <div className="w-full lg:w-80 bg-gray-50 p-6 rounded-lg h-fit">
          <h2 className="text-xl font-bold mb-6">Order Summary</h2>
          
          <div className="flex justify-between items-center mb-4 text-lg">
            <span>Total</span>
            <span className="font-bold">€{cartTotal.toFixed(2)}</span>
          </div>

          <Link
            href="/checkout"
            className="block w-full py-3 bg-black text-white text-center rounded-md hover:bg-gray-800 transition-colors font-semibold"
          >
            Proceed to Checkout
          </Link>
        </div>
      </div>
    </div>
  );
}
