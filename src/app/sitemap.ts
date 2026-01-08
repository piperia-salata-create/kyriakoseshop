import { MetadataRoute } from 'next';
import { getProducts } from '@/lib/woocommerce';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: `${siteUrl}/`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${siteUrl}/cart`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${siteUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
  ];

  // Fetch products
  let productUrls: MetadataRoute.Sitemap = [];

  try {
    const products = await getProducts(100); // Limit to 100 to avoid 400 errors

    productUrls = products.map((product) => ({
      url: `${siteUrl}/product/${product.slug}?id=${product.id}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.8,
    }));
  } catch (error) {
    console.error('Error fetching products for sitemap:', error);
  }

  return [...staticPages, ...productUrls];
}
