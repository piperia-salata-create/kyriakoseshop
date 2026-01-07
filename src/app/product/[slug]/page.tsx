import { getProductById } from "@/lib/woocommerce";
import { notFound } from "next/navigation";
import AddToCartButton from "@/components/AddToCartButton";
import Image from "next/image";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ id?: string }>;
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { id } = await searchParams;

  if (!id) {
    return {
      title: "Product Not Found",
    };
  }

  const product = await getProductById(id);

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
  const { id } = await searchParams;
  await params; // Await params to satisfy Next.js requirements, even if we don't use slug for fetching

  if (!id) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <p className="text-xl text-red-500">Product ID is missing from the URL.</p>
      </div>
    );
  }

  const product = await getProductById(id);

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