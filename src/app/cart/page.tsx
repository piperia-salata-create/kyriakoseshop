import type { Metadata } from "next";
import CartClient from "./CartClient";

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
  return <CartClient />;
}
