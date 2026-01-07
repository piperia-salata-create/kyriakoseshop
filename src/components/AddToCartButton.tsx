'use client';

import { useCart } from "@/context/CartContext";
import { Product } from "@/lib/woocommerce";
import Button from "./ui/Button";

export default function AddToCartButton({ product }: { product: Product }) {
  const { addToCart } = useCart();

  const handleAddToCart = () => {
    addToCart(product);
    alert("Added to cart!");
  };

  return (
    <Button
      onClick={handleAddToCart}
      size="lg"
      className="mt-4 w-full md:w-auto"
      type="button"
    >
      Add to Cart
    </Button>
  );
}
