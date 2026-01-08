import { MetadataRoute } from 'next';
import { getProducts } from '@/lib/woocommerce';

// Category interface for sitemap
interface Category {
  slug: string;
}

// Fetch categories from WooCommerce
async function getCategories() {
  const wordpressUrl = process.env.NEXT_PUBLIC_WORDPRESS_URL;
  const consumerKey = process.env.WC_CONSUMER_KEY?.trim();
  const consumerSecret = process.env.WC_CONSUMER_SECRET?.trim();

  if (!wordpressUrl || !consumerKey || !consumerSecret) {
    return [];
  }

  const baseUrl = wordpressUrl.replace(/\/$/, "");
  const url = `${baseUrl}/wp-json/wc/v3/products/categories?consumer_key=${consumerKey}&consumer_secret=${consumerSecret}`;

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Accept': 'application/json',
      },
      // ISR: Revalidate categories every hour
      // Categories change infrequently
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      return [];
    }

    const data = await res.json();
    return data;
  } catch (error) {
    console.error('Error fetching categories for sitemap:', error);
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const now = new Date();

  // Static pages with priority and change frequency
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: `${siteUrl}`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${siteUrl}/cart`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${siteUrl}/checkout`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${siteUrl}/thank-you`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ];

  // Fetch products from WooCommerce
  let productUrls: MetadataRoute.Sitemap = [];
  let categoryUrls: MetadataRoute.Sitemap = [];

  try {
    const products = await getProducts(100);

    productUrls = products.map((product) => {
      // Determine change frequency based on product status
      let changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'] = 'weekly';
      let priority: number = 0.8;
      
      if (product.stock_status === 'outofstock') {
        changeFrequency = 'monthly';
        priority = 0.5;
      }

      return {
        url: `${siteUrl}/product/${product.slug}`,
        lastModified: now,
        changeFrequency,
        priority,
      };
    });

    // Fetch and add categories
    const categories = await getCategories();
    if (Array.isArray(categories) && categories.length > 0) {
      categoryUrls = categories.map((category: Category) => ({
        url: `${siteUrl}/category/${category.slug}`,
        lastModified: now,
        changeFrequency: 'weekly',
        priority: 0.7,
      }));
    }
  } catch (error) {
    console.error('Error fetching content for sitemap:', error);
  }

  return [...staticPages, ...categoryUrls, ...productUrls];
}

// Also generate a robots.txt
export const robots = () => ({
  rules: {
    userAgent: '*',
    allow: '/',
    disallow: ['/cart', '/checkout', '/thank-you', '/api/'],
  },
  sitemap: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/sitemap.xml`,
});
