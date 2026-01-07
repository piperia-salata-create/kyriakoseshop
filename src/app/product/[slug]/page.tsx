import { getProductById, getProducts, getProductBySlug } from "@/lib/woocommerce";
import { notFound } from "next/navigation";
import AddToCartButton from "@/components/AddToCartButton";
import Image from "next/image";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ id?: string }>;
}

// Enable on-demand ISR for products not in the static params list
export const dynamicParams = true;

// Generate static params for the top 50 products at build time
export async function generateStaticParams() {
  const products = await getProducts(50);
  
  return products.map((product) => ({
    slug: product.slug,
  }));
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { id } = await searchParams;

  // Try to get product by slug first, then by id (for backward compatibility)
  let product = id ? await getProductById(id) : null;
  
  if (!product && slug) {
    product = await getProductBySlug(slug);
  }

  if (!product) {
    return {
      title: "Product Not Found",
    };
  }

  // Strip HTML tags from description and limit length
  const description = product.short_description.replace(/<[^>]*>?/gm, '').substring(0, 160);

  return {
    title: `${product.name} | Kyriakos E-Shop`,
    description: description,
    openGraph: {
      images: product.images[0] ? [product.images[0].src] : [],
    },
  };
}

export default async function ProductPage({ params, searchParams }: Props) {
  // In Next.js 15+, params and searchParams are Promises that must be awaited
  const { slug } = await params;
  const { id } = await searchParams;

  // Try to get product by slug first, then by id (for backward compatibility)
  let product = slug ? await getProductBySlug(slug) : null;
  
  if (!product && id) {
    product = await getProductById(id);
  }

  if (!product) {
    notFound();
  }

  return (
    <div className="min-h-screen p-8 sm:p-20">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
        {/* Left Column: Image */}
        <div className="bg-white rounded-lg overflow-hidden border border-gray-200 shadow-sm">
          {product.images[0] ? (
            <Image
              src={product.images[0].src}
              alt={product.images[0].alt || product.name}
              width={600}
              height={600}
              className="w-full h-auto object-cover"
              priority={true}
            />
          ) : (
            <div className="w-full h-96 bg-gray-100 flex items-center justify-center text-gray-400">
              No Image
            </div>
          )}
        </div>

        {/* Right Column: Details */}
        <div className="flex flex-col gap-6">
          <h1 className="text-4xl font-bold text-gray-900">{product.name}</h1>
          
          <p className="text-3xl font-bold text-gray-900">€{product.price}</p>
          
          <div 
            className="text-gray-600 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: product.short_description }}
          />

          <AddToCartButton product={product} />
        </div>
      </div>
    </div>
  );
}
