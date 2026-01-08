import { Product } from './woocommerce';

// Site URL for generating full URLs
const getSiteUrl = () => process.env.NEXT_PUBLIC_SITE_URL || 'https://kyriakoseshop.com';

// Product Schema.org structured data
export function generateProductSchema(product: Product): object {
  const siteUrl = getSiteUrl();
  const productUrl = `${siteUrl}/product/${product.slug}`;
  
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': productUrl,
    name: product.name,
    description: product.short_description.replace(/<[^>]*>?/gm, '').substring(0, 500),
    url: productUrl,
    image: product.images[0]?.src || null,
    offers: {
      '@type': 'Offer',
      url: productUrl,
      priceCurrency: 'EUR',
      price: product.price,
      availability: product.stock_status === 'outofstock' 
        ? 'https://schema.org/OutOfStock' 
        : 'https://schema.org/InStock',
      seller: {
        '@type': 'Organization',
        name: 'Kyriakos E-Shop',
        url: siteUrl,
      },
    },
    brand: {
      '@type': 'Brand',
      name: 'Kyriakos E-Shop',
    },
    sku: product.id.toString(),
  };
}

// Breadcrumb List Schema.org structured data
export function generateBreadcrumbSchema(breadcrumbs: Array<{ name: string; url: string }>): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: crumb.url.startsWith('http') ? crumb.url : `${getSiteUrl()}${crumb.url}`,
    })),
  };
}

// Organization Schema.org structured data
export function generateOrganizationSchema(): object {
  const siteUrl = getSiteUrl();
  
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Kyriakos E-Shop',
    url: siteUrl,
    logo: `${siteUrl}/logo.png`,
    sameAs: [
      'https://facebook.com/kyriakoseshop',
      'https://twitter.com/kyriakoseshop',
      'https://instagram.com/kyriakoseshop',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+1-800-555-0123',
      contactType: 'customer service',
      availableLanguage: 'English',
    },
  };
}

// WebSite Schema.org structured data with search capability
export function generateWebSiteSchema(): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Kyriakos E-Shop',
    url: getSiteUrl(),
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${getSiteUrl()}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

// Collection/Category Page Schema
export function generateCollectionSchema(name: string, description: string, url: string, productCount?: number): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: name,
    description: description,
    url: url,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: productCount || 0,
    },
  };
}

// Generate all site schemas as script tags
export function getSiteSchemas(): string {
  const schemas = [
    generateOrganizationSchema(),
    generateWebSiteSchema(),
  ];
  
  return schemas.map(schema => JSON.stringify(schema)).join('\n');
}
