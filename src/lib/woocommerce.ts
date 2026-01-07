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
}

export async function getProducts(): Promise<Product[]> {
  const wordpressUrl = process.env.NEXT_PUBLIC_WORDPRESS_URL;
  const consumerKey = process.env.WC_CONSUMER_KEY?.trim();
  const consumerSecret = process.env.WC_CONSUMER_SECRET?.trim();

  if (!wordpressUrl || !consumerKey || !consumerSecret) {
    throw new Error("Missing WooCommerce environment variables");
  }

  // Remove trailing slash from URL if present to avoid double slashes
  const baseUrl = wordpressUrl.replace(/\/$/, "");
  const endpoint = `${baseUrl}/wp-json/wc/v3/products`;
  
  const url = `${endpoint}?consumer_key=${consumerKey}&consumer_secret=${consumerSecret}`;

  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept": "application/json",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch products: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  return data as Product[];
}

export async function getProductById(id: string | number): Promise<Product | null> {
  const wordpressUrl = process.env.NEXT_PUBLIC_WORDPRESS_URL;
  const consumerKey = process.env.WC_CONSUMER_KEY?.trim();
  const consumerSecret = process.env.WC_CONSUMER_SECRET?.trim();

  if (!wordpressUrl || !consumerKey || !consumerSecret) {
    throw new Error("Missing WooCommerce environment variables");
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
    cache: "no-store",
  });

  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error(`Failed to fetch product: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  return data as Product;
}
