import { getProducts } from "@/lib/woocommerce";
import ProductCard from "@/components/ProductCard";
import type { Metadata } from "next";

// ISR: Revalidate home page every 5 minutes
// Products change frequently, so we want to show fresh content
export const revalidate = 300;

export const metadata: Metadata = {
  title: {
    default: 'Kyriakos E-Shop | Premium Online Store',
    template: '%s | Kyriakos E-Shop',
  },
  description: 'Discover our latest arrivals and shop premium products at Kyriakos E-Shop. Quality items with fast shipping.',
  keywords: ['online shop', 'e-commerce', 'premium products', 'shopping'],
  authors: [{ name: 'Kyriakos E-Shop' }],
  creator: 'Kyriakos E-Shop',
  publisher: 'Kyriakos E-Shop',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'Kyriakos E-Shop',
    title: 'Kyriakos E-Shop | Premium Online Store',
    description: 'Discover our latest arrivals and shop premium products at Kyriakos E-Shop.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Kyriakos E-Shop | Premium Online Store',
    description: 'Discover our latest arrivals and shop premium products at Kyriakos E-Shop.',
  },
  alternates: {
    canonical: '/',
  },
};

export default async function Home() {
  const products = await getProducts();

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-background)' }}>
      {/* Hero Section */}
      <section className="py-20 px-8 text-center">
        <h1 className="font-[family-name:var(--font-playfair)] text-5xl md:text-6xl font-bold mb-6" style={{ color: 'var(--color-primary)' }}>
          Summer Collection 2024
        </h1>
        <p className="text-xl mb-8 max-w-2xl mx-auto" style={{ color: 'var(--color-primary)', opacity: 0.7 }}>
          Discover our latest arrivals and embrace the season with style.
        </p>
        <a 
          href="#products"
          className="inline-block px-8 py-3 rounded-full font-semibold transition-colors"
          style={{ 
            backgroundColor: 'var(--color-primary)', 
            color: 'var(--color-surface)'
          }}
        >
          Shop Now
        </a>
      </section>

      {/* Products Grid */}
      <main id="products" className="flex flex-col gap-8 items-center px-8 pb-20">
        {products.length === 0 ? (
          <p className="text-xl" style={{ color: 'var(--color-primary)', opacity: 0.7 }}>No products found.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 w-full max-w-7xl">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
