import Link from "next/link";

export function Header() {
  return (
    <header className="border-b bg-white">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="text-xl font-bold">
          Store
        </Link>
        <nav>{/* Navigation items will go here */}</nav>
      </div>
    </header>
  );
}