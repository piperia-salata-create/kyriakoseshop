import Link from "next/link";

export default function ThankYouPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 gap-6 text-center">
      <h1 className="text-4xl font-bold text-green-600">Thank you for your order!</h1>
      <p className="text-lg text-gray-600">Your order has been placed successfully.</p>
      <Link
        href="/"
        className="px-8 py-4 bg-black text-white text-lg font-semibold rounded-md hover:bg-gray-800 transition-colors"
      >
        Continue Shopping
      </Link>
    </div>
  );
}