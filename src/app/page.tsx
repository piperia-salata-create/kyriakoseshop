import { getProducts } from "@/lib/woocommerce";
import Link from "next/link";
import Image from "next/image";

export default async function Home() {
  const products = await getProducts();

  return (
    <div className="min-h-screen p-8 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 items-center sm:items-start">
        <h1 className="text-4xl font-bold mb-4">Kyriakos E-Shop</h1>
        
        {products.length === 0 ? (
          <p className="text-xl text-gray-500">No products found.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 w-full">
            {products.map((product) => (
              <Link 
                href={`/product/${product.slug}?id=${product.id}`}
                key={product.id} 
                className="border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col bg-white"
              >
                {product.images[0] ? (
                  <Image
                    src={product.images[0].src} 
                    alt={product.images[0].alt || product.name} 
                    width={400}
                    height={400}
                    className="w-full h-64 object-cover rounded-md mb-4"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-64 bg-gray-100 rounded-md mb-4 flex items-center justify-center text-gray-400">No Image</div>
                )}
                <h2 className="text-lg font-semibold mb-2 line-clamp-2">{product.name}</h2>
                {product.short_description && (
                  <p 
                    className="text-sm text-gray-500 mb-3 line-clamp-2"
                    dangerouslySetInnerHTML={{ __html: product.short_description }}
                  />
                )}
                <p className="text-xl font-bold mt-auto text-gray-900">€{product.price}</p>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
