import Link from "next/link";
import CartIcon from "./CartIcon";

export default function Header() {
  return (
    <header className="w-full border-b border-gray-100 bg-white">
      <div className="max-w-7xl mx-auto px-8 py-6 flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold tracking-tight">
          Kyriakos E-Shop
        </Link>
        <nav>
          <CartIcon />
        </nav>
      </div>
    </header>
  );
}