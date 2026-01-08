export interface Product {
  id: number;
  name: string;
  slug: string;
  price: string;
  images: {
    id: number;
    src: string;
    alt: string;
  }[];
  short_description: string;
  stock_status?: 'instock' | 'outofstock' | 'onbackorder';
  stock_quantity?: number | null;
  purchasable?: boolean;
}

export async function getProducts(perPage: number = 10): Promise<Product[]> {
  const wordpressUrl = process.env.NEXT_PUBLIC_WORDPRESS_URL;
  const consumerKey = process.env.WC_CONSUMER_KEY?.trim();
  const consumerSecret = process.env.WC_CONSUMER_SECRET?.trim();

  // Return empty array if env vars are missing (for build time)
  if (!wordpressUrl || !consumerKey || !consumerSecret) {
    console.warn("Missing WooCommerce environment variables - returning empty products");
    return [];
  }

  // Remove trailing slash from URL if present to avoid double slashes
  const baseUrl = wordpressUrl.replace(/\/$/, "");
  const endpoint = `${baseUrl}/wp-json/wc/v3/products`;
  
  const url = `${endpoint}?consumer_key=${consumerKey}&consumer_secret=${consumerSecret}&per_page=${perPage}`;

  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept": "application/json",
    },
    // ISR with tags for on-demand revalidation
    next: { 
      revalidate: 300,
      tags: ['products', 'product-list'],
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch products: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  return data as Product[];
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const products = await getProducts(100); // Fetch up to 100 products to find by slug
  return products.find((p) => p.slug === slug) || null;
}

export async function getProductById(id: string | number): Promise<Product | null> {
  const wordpressUrl = process.env.NEXT_PUBLIC_WORDPRESS_URL;
  const consumerKey = process.env.WC_CONSUMER_KEY?.trim();
  const consumerSecret = process.env.WC_CONSUMER_SECRET?.trim();

  // Return null if env vars are missing (for build time)
  if (!wordpressUrl || !consumerKey || !consumerSecret) {
    console.warn("Missing WooCommerce environment variables - returning null");
    return null;
  }

  // Remove trailing slash from URL if present to avoid double slashes
  const baseUrl = wordpressUrl.replace(/\/$/, "");
  const endpoint = `${baseUrl}/wp-json/wc/v3/products/${id}`;
  
  const url = `${endpoint}?consumer_key=${consumerKey}&consumer_secret=${consumerSecret}`;

  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept": "application/json",
    },
    // ISR with tags for on-demand revalidation
    next: { 
      revalidate: 60,
      tags: ['products', `product-${id}`],
    },
  });

  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error(`Failed to fetch product: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  return data as Product;
}
