'use client';

import { useCart } from "@/context/CartContext";
import { useRouter } from "next/navigation";
import { useState, FormEvent, useEffect } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { parseApiError, getUserFriendlyMessage, ErrorCode } from "@/lib/errors";
import { logCartAction } from "@/lib/logger";

export default function CheckoutClient() {
  const { cartItems, cartTotal, clearCart, removeOutOfStockItems } = useCart();
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
      setError(getUserFriendlyMessage({
        code: ErrorCode.CART_EMPTY,
        message: 'Your cart is empty.',
        timestamp: new Date().toISOString(),
        source: 'cart',
      }));
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
        const normalizedError = parseApiError(res, data);
        
        // Handle out-of-stock items by removing them from cart
        if (normalizedError.details?.out_of_stock_product_ids && normalizedError.details.out_of_stock_product_ids.length > 0) {
          removeOutOfStockItems(normalizedError.details.out_of_stock_product_ids);
          
          // Build detailed message for removed items
          const removedItems = normalizedError.details.validation_errors
            ?.filter(err => normalizedError.details?.out_of_stock_product_ids?.includes(err.product_id))
            .map(err => err.product_name)
            .join(', ') || '';
            
          setError(`${getUserFriendlyMessage(normalizedError)}\n\nRemoved items: ${removedItems}`);
        } else {
          setError(getUserFriendlyMessage(normalizedError));
        }
        setIsSubmitting(false);
        return;
      }

      alert('Order Placed!');
      logCartAction('checkout', 0);
      clearCart();
      router.push('/thank-you');
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error('An unexpected error occurred');
      setError(getUserFriendlyMessage({
        code: ErrorCode.NETWORK_ERROR,
        message: error.message || 'An unexpected error occurred.',
        timestamp: new Date().toISOString(),
        source: 'network',
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen p-8 sm:p-20" style={{ backgroundColor: 'var(--color-background)', color: 'var(--color-primary)' }}>
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>
      
      {error && (
        <div className="px-4 py-3 rounded mb-6" style={{ backgroundColor: '#fee2e2', border: '1px solid #fecaca', color: '#b91c1c' }}>
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
        <div className="p-6 rounded-lg h-fit" style={{ backgroundColor: 'var(--color-background)' }}>
          <h2 className="text-xl font-semibold mb-6">Your Order</h2>
          <div className="flex flex-col gap-4 mb-6">
            {cartItems.map((item) => (
              <div key={item.id} className="flex justify-between items-center text-sm" style={{ color: 'var(--color-primary)' }}>
                <div className="flex items-center gap-2">
                   <span>{item.name} x {item.quantity}</span>
                </div>
                <span>€{(parseFloat(item.price) * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="pt-4 flex justify-between items-center text-lg font-bold" style={{ color: 'var(--color-primary)', borderTopColor: 'var(--color-secondary)' }}>
            <span>Estimated Total*</span>
            <span>€{cartTotal.toFixed(2)}</span>
          </div>
          <p className="text-xs mt-2" style={{ color: 'var(--color-secondary)' }}>
            * Final total may vary based on current prices at checkout
          </p>
        </div>
      </div>
    </div>
  );
}
