/**
 * SEO utilities for generating meta tags and structured data
 * @module utils/seo
 */

export interface MetaTagsConfig {
  title: string;
  description: string;
  image?: string;
  url: URL | string;
  type?: 'website' | 'article';
  author?: string;
  publishDate?: Date;
  keywords?: string[];
  noIndex?: boolean;
  siteName?: string;
  twitterHandle?: string;
  locale?: string;
}

interface MetaTag {
  name?: string;
  property?: string;
  content: string;
}

/**
 * Generate standard SEO meta tags
 * @param config - Configuration for meta tag generation
 * @returns Array of meta tag objects
 */
export const generateMetaTags = (config: MetaTagsConfig): MetaTag[] => {
  const {
    title,
    description,
    image,
    url,
    type = 'website',
    author,
    publishDate,
    keywords,
    noIndex = false,
    siteName,
    twitterHandle,
    locale = 'en_US',
  } = config;

  const metaTags: MetaTag[] = [
    // Primary Meta Tags
    { name: 'title', content: title },
    { name: 'description', content: description },

    // Open Graph / Facebook
    { property: 'og:type', content: type },
    { property: 'og:url', content: url.toString() },
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    { property: 'og:locale', content: locale },
  ];

  if (siteName) {
    metaTags.push({ property: 'og:site_name', content: siteName });
  }

  if (noIndex) {
    metaTags.push({ name: 'robots', content: 'noindex, nofollow' });
  } else {
    metaTags.push({ name: 'robots', content: 'index, follow' });
  }

  if (keywords && keywords.length > 0) {
    metaTags.push({ name: 'keywords', content: keywords.join(', ') });
  }

  if (image) {
    metaTags.push({ property: 'og:image', content: image });
    // Twitter expects `name="twitter:*"` rather than `property`.
    metaTags.push({ name: 'twitter:image', content: image });
  }

  // Twitter
  metaTags.push(
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:url', content: url.toString() },
    { name: 'twitter:title', content: title },
    { name: 'twitter:description', content: description }
  );

  if (twitterHandle) {
    metaTags.push({ name: 'twitter:site', content: twitterHandle });
    metaTags.push({ name: 'twitter:creator', content: twitterHandle });
  }

  // Article specific
  if (type === 'article') {
    if (author) {
      metaTags.push({ property: 'article:author', content: author });
    }
    if (publishDate) {
      metaTags.push({
        property: 'article:published_time',
        content: publishDate.toISOString(),
      });
    }
  }

  return metaTags;
};

/**
 * Generate JSON-LD structured data for articles
 */
export const generateArticleSchema = (config: {
  title: string;
  description: string;
  author: string;
  publishDate: Date;
  modifiedDate?: Date;
  url: string;
  image?: string;
}): object => {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: config.title,
    description: config.description,
    author: {
      '@type': 'Person',
      name: config.author,
    },
    datePublished: config.publishDate.toISOString(),
    dateModified: (config.modifiedDate ?? config.publishDate).toISOString(),
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': config.url,
    },
    ...(config.image && {
      image: {
        '@type': 'ImageObject',
        url: config.image,
      },
    }),
  };
};

/**
 * Generate JSON-LD structured data for organizations
 */
export const generateOrganizationSchema = (config: {
  name: string;
  url: string;
  logo?: string;
  description?: string;
  socialProfiles?: string[];
}): object => {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: config.name,
    url: config.url,
    ...(config.logo && { logo: config.logo }),
    ...(config.description && { description: config.description }),
    ...(config.socialProfiles && { sameAs: config.socialProfiles }),
  };
};

/**
 * Generate JSON-LD breadcrumb schema
 */
export const generateBreadcrumbSchema = (
  items: Array<{ name: string; url: string }>
): object => {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
};

/**
 * Generate canonical URL
 */
export const getCanonicalUrl = (url: URL | string, baseUrl: string): string => {
  const urlStr = url.toString();
  if (urlStr.startsWith('http')) {
    return urlStr;
  }
  return new URL(urlStr, baseUrl).toString();
};

/**
 * Truncate meta description to optimal length
 */
export const truncateMetaDescription = (
  description: string,
  maxLength = 155
): string => {
  if (description.length <= maxLength) {
    return description;
  }

  const truncated = description.slice(0, maxLength - 3);
  const lastSpace = truncated.lastIndexOf(' ');

  if (lastSpace > maxLength - 30) {
    return truncated.slice(0, lastSpace) + '...';
  }

  return truncated + '...';
};
