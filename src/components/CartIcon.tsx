'use client';

import { useCart } from "@/context/CartContext";
import Link from "next/link";

export default function CartIcon() {
  const { cartCount } = useCart();

  return (
    <Link href="/cart" className="flex items-center gap-2 hover:opacity-70 transition-opacity">
      <span className="text-lg font-medium">Cart</span>
      <span className="bg-black text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
        {cartCount}
      </span>
    </Link>
  );
}