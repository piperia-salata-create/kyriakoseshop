import Image from "next/image";
import Link from "next/link";
import { spacing, shadows, transitions, radius, typography } from "@/lib/design-tokens";

interface ProductCardProps {
  product: {
    id: number;
    name: string;
    slug: string;
    price: string;
    short_description?: string;
    stock_status?: 'instock' | 'outofstock' | 'onbackorder';
    images: Array<{
      src: string;
      alt?: string;
    }>;
  };
}

export default function ProductCard({ product }: ProductCardProps) {
  const isOutOfStock = product.stock_status === 'outofstock';

  return (
    <Link
      href={`/product/${product.slug}?id=${product.id}`}
      className={`
        rounded-[${radius.lg}] 
        overflow-hidden
        transition-all 
        duration-[${transitions.slow}]
        hover:shadow-[${shadows.lg}]
        hover:-translate-y-[0.25rem]
      `}
      style={{ backgroundColor: 'var(--color-surface)' }}
      aria-disabled={isOutOfStock}
    >
      {product.images[0] ? (
        <div className={`relative aspect-square w-full overflow-hidden bg-[var(--color-background)]`}>
          <Image
            src={product.images[0].src}
            alt={product.images[0].alt || product.name}
            fill
            className={`object-cover transition-opacity duration-[${transitions.normal}] ${isOutOfStock ? 'opacity-50' : ''}`}
            loading="lazy"
          />
          {isOutOfStock && (
            <div className={`absolute inset-0 flex items-center justify-center bg-[var(--color-primary)]/50`}>
              <span className={`px-4 py-2 rounded-[${radius.md}] bg-[var(--color-surface)] font-medium text-sm`} style={{ color: 'var(--color-primary)' }}>
                Out of Stock
              </span>
            </div>
          )}
        </div>
      ) : (
        <div 
          className={`aspect-square w-full flex items-center justify-center`}
          style={{ backgroundColor: 'var(--color-background)', color: 'var(--color-primary)' }}
        >
          No Image
        </div>
      )}
      <div className={`p-[${spacing.md}]`}>
        <h2 
          className={`text-lg font-semibold mb-[${spacing.sm}] line-clamp-2`}
          style={{ color: 'var(--color-primary)' }}
        >
          {product.name}
        </h2>
        {product.short_description && (
          <p
            className={`text-sm mb-[${spacing.md}] line-clamp-2`}
            style={{ color: 'var(--color-primary)', opacity: 0.7 }}
            dangerouslySetInnerHTML={{ __html: product.short_description }}
          />
        )}
        <p 
          className="text-xl font-bold mt-auto"
          style={{ color: 'var(--color-secondary)' }}
        >
          €{product.price}
        </p>
      </div>
    </Link>
  );
}
