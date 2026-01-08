import { getProductById, getProducts, getProductBySlug } from "@/lib/woocommerce";
import { notFound } from "next/navigation";
import AddToCartButton from "@/components/AddToCartButton";
import Image from "next/image";
import type { Metadata } from "next";
import { generateProductSchema, generateBreadcrumbSchema } from "@/lib/schema";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ id?: string }>;
}

// Enable on-demand ISR for products not in the static params list
export const dynamicParams = true;

// ISR: Revalidate product pages every 60 seconds
// This ensures price/stock changes are reflected reasonably quickly
export const revalidate = 60;

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
      title: "Product Not Found | Kyriakos E-Shop",
      description: "The requested product could not be found.",
    };
  }

  // Strip HTML tags from description and limit length
  const description = product.short_description.replace(/<[^>]*>?/gm, '').substring(0, 160);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://kyriakoseshop.com';
  const productUrl = `${siteUrl}/product/${product.slug}`;

  return {
    title: {
      default: `${product.name} | Kyriakos E-Shop`,
      template: `%s | ${product.name}`,
    },
    description: description,
    keywords: [`${product.name}`, 'buy', 'shop', 'online'],
    authors: [{ name: 'Kyriakos E-Shop' }],
    creator: 'Kyriakos E-Shop',
    publisher: 'Kyriakos E-Shop',
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    openGraph: {
      type: 'website',
      locale: 'en_US',
      url: productUrl,
      siteName: 'Kyriakos E-Shop',
      title: product.name,
      description: description,
      images: product.images[0] ? [
        {
          url: product.images[0].src,
          width: 600,
          height: 600,
          alt: product.images[0].alt || product.name,
        }
      ] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: product.name,
      description: description,
      images: product.images[0] ? [product.images[0].src] : [],
      creator: '@kyriakoseshop',
    },
    alternates: {
      canonical: productUrl,
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

  // Generate structured data
  const productSchema = generateProductSchema(product);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://kyriakoseshop.com';
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: product.name, url: `/product/${product.slug}` },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <div className="min-h-screen p-8 sm:p-20" style={{ backgroundColor: 'var(--color-background)', color: 'var(--color-primary)' }}>
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
          {/* Left Column: Image */}
          <div className="rounded-lg overflow-hidden shadow-sm" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-secondary)' }}>
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
              <div className="w-full h-96 flex items-center justify-center" style={{ backgroundColor: 'var(--color-background)', color: 'var(--color-primary)' }}>
                No Image
              </div>
            )}
          </div>

          {/* Right Column: Details */}
          <div className="flex flex-col gap-6">
            <h1 className="text-4xl font-bold" style={{ color: 'var(--color-primary)' }}>{product.name}</h1>
            
            <p className="text-3xl font-bold" style={{ color: 'var(--color-secondary)' }}>€{product.price}</p>
            
            <div 
              className="leading-relaxed"
              style={{ color: 'var(--color-primary)', opacity: 0.8 }}
              dangerouslySetInnerHTML={{ __html: product.short_description }}
            />

            <AddToCartButton product={product} />
          </div>
        </div>
      </div>
    </>
  );
}
