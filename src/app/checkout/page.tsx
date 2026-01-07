'use client';

import { useCart } from "@/context/CartContext";
import { useRouter } from "next/navigation";
import { useState, FormEvent, useEffect } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export default function CheckoutPage() {
  const { cartItems, cartTotal, clearCart } = useCart();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    address_1: '',
    city: '',
    postcode: '',
    country: '',
    email: '',
    phone: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    if (cartItems.length === 0) {
      setError("Your cart is empty.");
      setIsSubmitting(false);
      return;
    }

    const line_items = cartItems.map((item) => ({
      product_id: item.id,
      quantity: item.quantity,
    }));

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          billing: formData,
          line_items,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      alert('Order Placed!');
      clearCart();
      router.push('/thank-you');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen p-8 sm:p-20">
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Left Column: Billing Form */}
        <div>
          <h2 className="text-xl font-semibold mb-6">Billing Details</h2>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="First Name"
                name="first_name"
                required
                value={formData.first_name}
                onChange={handleChange}
              />
              <Input
                label="Last Name"
                name="last_name"
                required
                value={formData.last_name}
                onChange={handleChange}
              />
            </div>

            <Input
              label="Address"
              name="address_1"
              required
              value={formData.address_1}
              onChange={handleChange}
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="City"
                name="city"
                required
                value={formData.city}
                onChange={handleChange}
              />
              <Input
                label="Postcode / ZIP"
                name="postcode"
                required
                value={formData.postcode}
                onChange={handleChange}
              />
            </div>

            <Input
              label="Country"
              name="country"
              required
              value={formData.country}
              onChange={handleChange}
            />

            <Input
              label="Email"
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
            />

            <Input
              label="Phone"
              type="tel"
              name="phone"
              required
              value={formData.phone}
              onChange={handleChange}
            />

            <Button
              type="submit"
              disabled={isSubmitting}
              className="mt-6 w-full"
            >
              {isSubmitting ? 'Placing Order...' : 'Place Order'}
            </Button>
          </form>
        </div>

        {/* Right Column: Order Summary */}
        <div className="bg-gray-50 p-6 rounded-lg h-fit">
          <h2 className="text-xl font-semibold mb-6">Your Order</h2>
          <div className="flex flex-col gap-4 mb-6">
            {cartItems.map((item) => (
              <div key={item.id} className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2">
                   <span>{item.name} x {item.quantity}</span>
                </div>
                <span>€{(parseFloat(item.price) * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-200 pt-4 flex justify-between items-center text-xl font-bold">
            <span>Total</span>
            <span>€{cartTotal.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
