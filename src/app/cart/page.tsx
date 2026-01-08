'use client';

import { useCart } from "@/context/CartContext";
import Link from "next/link";
import { useEffect, useState } from "react";
import Image from "next/image";
import type { Metadata } from "next";
import EmptyState from "@/components/ui/EmptyState";

export const metadata: Metadata = {
  title: 'Shopping Cart | Kyriakos E-Shop',
  description: 'View and manage your shopping cart at Kyriakos E-Shop. Review your items and proceed to checkout.',
  openGraph: {
    title: 'Shopping Cart | Kyriakos E-Shop',
    description: 'View and manage your shopping cart.',
    type: 'website',
  },
  alternates: {
    canonical: '/cart',
  },
};

export default function CartPage() {
  const { cartItems, removeFromCart, updateQuantity, cartTotal, clearCart } = useCart();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch by ensuring we only render on the client
  useEffect(() => {
    const id = setTimeout(() => {
      setMounted(true);
    }, 0);
    return () => clearTimeout(id);
  }, []);

  if (!mounted) return null;

  if (cartItems.length === 0) {
    return (
      <EmptyState
        title="Your Cart is Empty"
        description="Looks like you haven't added anything yet."
        action={{
          label: "Continue Shopping",
          href: "/"
        }}
      />
    );
  }

  return (
    <div className="min-h-screen p-8 sm:p-20" style={{ backgroundColor: 'var(--color-background)', color: 'var(--color-primary)' }}>
      <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>

      <div className="flex flex-col lg:flex-row gap-12">
        {/* Cart Items List */}
        <div className="flex-1 flex flex-col gap-6">
          {cartItems.map((item) => (
            <div
              key={item.id}
              className="flex flex-col sm:flex-row items-center gap-6 pb-6"
              style={{ borderBottomColor: 'var(--color-secondary)' }}
            >
              {/* Image */}
              <div className="w-24 h-24 flex-shrink-0 rounded-md overflow-hidden" style={{ backgroundColor: 'var(--color-background)' }}>
                {item.images[0] ? (
                  <Image
                    src={item.images[0].src}
                    alt={item.images[0].alt || item.name}
                    width={96}
                    height={96}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs" style={{ color: 'var(--color-primary)' }}>
                    No Image
                  </div>
                )}
              </div>

              {/* Details */}
              <div className="flex-1 text-center sm:text-left">
                <h2 className="text-lg font-semibold" style={{ color: 'var(--color-primary)' }}>{item.name}</h2>
                <p style={{ color: 'var(--color-secondary)' }}>€{item.price}</p>
              </div>

              {/* Quantity */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  className="w-8 h-8 flex items-center justify-center rounded hover:opacity-80 transition-colors"
                  style={{ 
                    borderColor: 'var(--color-secondary)', 
                    color: 'var(--color-primary)',
                    backgroundColor: 'transparent' 
                  }}
                >
                  -
                </button>
                <span className="min-w-[2ch] text-center" style={{ color: 'var(--color-primary)' }}>{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  className="w-8 h-8 flex items-center justify-center rounded hover:opacity-80 transition-colors"
                  style={{ 
                    borderColor: 'var(--color-secondary)', 
                    color: 'var(--color-primary)',
                    backgroundColor: 'transparent' 
                  }}
                >
                  +
                </button>
              </div>

              {/* Remove Button */}
              <button
                onClick={() => removeFromCart(item.id)}
                className="font-medium text-sm hover:opacity-70 transition-colors"
                style={{ color: '#ef4444' }}
              >
                Remove
              </button>
            </div>
          ))}
          
          <button 
            onClick={clearCart}
            className="self-start text-sm mt-2 hover:opacity-70 transition-colors underline"
            style={{ color: 'var(--color-primary)' }}
          >
            Clear Cart
          </button>
        </div>

        {/* Summary Section */}
        <div className="w-full lg:w-80 p-6 rounded-lg h-fit" style={{ backgroundColor: 'var(--color-background)' }}>
          <h2 className="text-xl font-bold mb-6" style={{ color: 'var(--color-primary)' }}>Order Summary</h2>
          
          <div className="flex justify-between items-center mb-4 text-lg" style={{ color: 'var(--color-primary)' }}>
            <span>Total</span>
            <span className="font-bold">€{cartTotal.toFixed(2)}</span>
          </div>

          <Link
            href="/checkout"
            className="block w-full py-3 text-center rounded-md hover:opacity-90 transition-colors font-semibold"
            style={{ 
              backgroundColor: 'var(--color-primary)', 
              color: 'var(--color-surface)' 
            }}
          >
            Proceed to Checkout
          </Link>
        </div>
      </div>
    </div>
  );
}
