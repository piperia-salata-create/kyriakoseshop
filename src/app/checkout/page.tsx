import type { Metadata } from "next";
import CheckoutClient from "./CheckoutClient";

export const metadata: Metadata = {
  title: 'Checkout | Kyriakos E-Shop',
  description: 'Complete your purchase securely at Kyriakos E-Shop. Enter your billing details to place your order.',
  robots: {
    index: false,
    follow: true,
  },
  openGraph: {
    title: 'Checkout | Kyriakos E-Shop',
    description: 'Complete your purchase securely.',
    type: 'website',
  },
  alternates: {
    canonical: '/checkout',
  },
};

export default function CheckoutPage() {
  return <CheckoutClient />;
}
