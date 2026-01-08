import Link from "next/link";

export default function ThankYouPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 gap-6 text-center" style={{ backgroundColor: 'var(--color-background)', color: 'var(--color-primary)' }}>
      <h1 className="text-4xl font-bold" style={{ color: '#22c55e' }}>Thank you for your order!</h1>
      <p className="text-lg" style={{ color: 'var(--color-primary)', opacity: 0.7 }}>Your order has been placed successfully.</p>
      <Link
        href="/"
        className="px-8 py-4 text-lg font-semibold rounded-md hover:opacity-90 transition-colors"
        style={{ 
          backgroundColor: 'var(--color-primary)', 
          color: 'var(--color-surface)' 
        }}
      >
        Continue Shopping
      </Link>
    </div>
  );
}