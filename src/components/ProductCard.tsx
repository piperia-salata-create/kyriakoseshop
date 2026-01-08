import Image from "next/image";
import Link from "next/link";

interface ProductCardProps {
  product: {
    id: number;
    name: string;
    slug: string;
    price: string;
    short_description?: string;
    images: Array<{
      src: string;
      alt?: string;
    }>;
  };
}

export default function ProductCard({ product }: ProductCardProps) {
  return (
    <Link
      href={`/product/${product.slug}?id=${product.id}`}
      className="rounded-xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden"
      style={{ backgroundColor: 'var(--color-surface)' }}
    >
      {product.images[0] ? (
        <div className="relative aspect-square w-full overflow-hidden">
          <Image
            src={product.images[0].src}
            alt={product.images[0].alt || product.name}
            fill
            className="object-cover"
            loading="lazy"
          />
        </div>
      ) : (
        <div className="aspect-square w-full flex items-center justify-center" style={{ backgroundColor: 'var(--color-background)', color: 'var(--color-primary)' }}>
          No Image
        </div>
      )}
      <div className="p-4">
        <h2 className="text-lg font-semibold mb-2 line-clamp-2" style={{ color: 'var(--color-primary)' }}>{product.name}</h2>
        {product.short_description && (
          <p
            className="text-sm mb-3 line-clamp-2"
            style={{ color: 'var(--color-primary)', opacity: 0.7 }}
            dangerouslySetInnerHTML={{ __html: product.short_description }}
          />
        )}
        <p className="text-xl font-bold mt-auto" style={{ color: 'var(--color-secondary)' }}>€{product.price}</p>
      </div>
    </Link>
  );
}
