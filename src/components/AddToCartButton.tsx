'use client';

import { useCart } from "@/context/CartContext";
import { Product } from "@/lib/woocommerce";

export default function AddToCartButton({ product }: { product: Product }) {
  const { addToCart } = useCart();

  const handleAddToCart = () => {
    addToCart(product);
    alert("Added to cart!");
  };

  return (
    <button
      onClick={handleAddToCart}
      className="mt-4 w-full md:w-auto px-8 py-4 bg-black text-white text-lg font-semibold rounded-md hover:bg-gray-800 transition-colors"
      type="button"
    >
      Add to Cart
    </button>
  );
}