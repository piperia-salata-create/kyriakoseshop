'use client';

import { useCart } from "@/context/CartContext";
import Link from "next/link";

export default function CartIcon() {
  const { cartCount } = useCart();

  return (
    <Link href="/cart" className="flex items-center gap-2 hover:opacity-70 transition-opacity" style={{ color: 'var(--color-primary)' }}>
      <span className="text-lg font-medium">Cart</span>
      <span 
        className="text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center"
        style={{ 
          backgroundColor: 'var(--color-primary)', 
          color: 'var(--color-surface)' 
        }}
      >
        {cartCount}
      </span>
    </Link>
  );
}