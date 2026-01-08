import Link from "next/link";
import CartIcon from "./CartIcon";

export default function Header() {
  return (
    <header 
      className="w-full sticky top-0 z-50 border-b"
      style={{ 
        backgroundColor: 'var(--color-surface)',
        borderColor: 'var(--color-secondary)'
      }}
    >
      <div className="max-w-7xl mx-auto px-8 py-6 flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold tracking-tight" style={{ color: 'var(--color-primary)' }}>
          Kyriakos E-Shop
        </Link>
        <nav>
          <CartIcon />
        </nav>
      </div>
    </header>
  );
}