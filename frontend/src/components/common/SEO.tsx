/**
 * SEO компоненты для улучшения поисковой оптимизации
 * - JSON-LD микроразметка schema.org
 * - Мета-теги
 */

import { Trailer } from '../../types';
import { formatPrice } from '../../utils';
import { getAvailabilityLabel, getMainImage } from '../../features/trailers';

// ============================================================================
// PRODUCT SCHEMA (schema.org/Product)
// ============================================================================

export interface ProductSchemaProps {
  trailer: Trailer;
  /** Базовый URL сайта */
  baseUrl?: string;
}

/**
 * JSON-LD микроразметка для товара (прицепа)
 * Вставляется в <head> или в тело страницы
 */
export const ProductSchema = ({
  trailer,
  baseUrl = 'https://mzsa-gem-monolith-production.up.railway.app',
}: ProductSchemaProps) => {
  const imageUrl = getMainImage(trailer);
  // Проверяем наличие по stock > 0 или availability === 'in_stock'
  const isInStock = (trailer.stock && trailer.stock > 0) || trailer.availability === 'in_stock';
  const availability = isInStock
    ? 'https://schema.org/InStock'
    : trailer.availability === 'days_1_3'
    ? 'https://schema.org/PreOrder'
    : 'https://schema.org/PreOrder';

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: `${trailer.model} - ${trailer.name}`,
    description: trailer.description || `Прицеп ${trailer.model} от официального дилера МЗСА`,
    image: imageUrl ? (imageUrl.startsWith('http') ? imageUrl : `${baseUrl}${imageUrl}`) : undefined,
    sku: trailer.id,
    mpn: trailer.model,
    brand: {
      '@type': 'Brand',
      name: 'МЗСА',
    },
    manufacturer: {
      '@type': 'Organization',
      name: 'Миасский завод специализированных автомобилей',
    },
    offers: {
      '@type': 'Offer',
      url: `${baseUrl}/catalog?id=${trailer.id}`,
      priceCurrency: 'RUB',
      price: trailer.price,
      priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      availability,
      seller: {
        '@type': 'Organization',
        name: 'Охота на рыбалку',
        telephone: '+7 (3462) 22-33-55',
        address: {
          '@type': 'PostalAddress',
          streetAddress: 'пр-т Мира, 55',
          addressLocality: 'Сургут',
          addressRegion: 'ХМАО-Югра',
          postalCode: '628400',
          addressCountry: 'RU',
        },
      },
    },
    // Дополнительные характеристики
    ...(trailer.capacity && {
      weight: {
        '@type': 'QuantitativeValue',
        value: trailer.capacity,
        unitCode: 'KGM',
        name: 'Грузоподъёмность',
      },
    }),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema, null, 0) }}
    />
  );
};

// ============================================================================
// BREADCRUMBS SCHEMA
// ============================================================================

export interface BreadcrumbItem {
  name: string;
  url?: string;
}

export interface BreadcrumbSchemaProps {
  items: BreadcrumbItem[];
  baseUrl?: string;
}

/**
 * JSON-LD микроразметка для хлебных крошек
 */
export const BreadcrumbSchema = ({
  items,
  baseUrl = 'https://mzsa-gem-monolith-production.up.railway.app',
}: BreadcrumbSchemaProps) => {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url ? `${baseUrl}${item.url}` : undefined,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema, null, 0) }}
    />
  );
};

// ============================================================================
// LOCAL BUSINESS SCHEMA
// ============================================================================

export interface LocalBusinessSchemaProps {
  baseUrl?: string;
}

/**
 * JSON-LD микроразметка для локального бизнеса
 * Используется на главной странице и странице контактов
 */
export const LocalBusinessSchema = ({
  baseUrl = 'https://mzsa-gem-monolith-production.up.railway.app',
}: LocalBusinessSchemaProps) => {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Store',
    name: 'Охота на рыбалку - официальный дилер МЗСА',
    description: 'Продажа прицепов МЗСА в Сургуте, Нижневартовске, Ноябрьске и Новом Уренгое. Бортовые, лодочные и коммерческие прицепы.',
    url: baseUrl,
    logo: `${baseUrl}/images/onr-logo.png`,
    telephone: '+7 (3462) 22-33-55',
    email: 'info@o-n-r.ru',
    priceRange: '₽₽',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'пр-т Мира, 55',
      addressLocality: 'Сургут',
      addressRegion: 'ХМАО-Югра',
      postalCode: '628400',
      addressCountry: 'RU',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 61.254032,
      longitude: 73.396221,
    },
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        opens: '09:00',
        closes: '20:00',
      },
    ],
    sameAs: [
      'https://o-n-r.ru',
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema, null, 0) }}
    />
  );
};

// ============================================================================
// META TAGS COMPONENT
// ============================================================================

export interface MetaTagsProps {
  title: string;
  description: string;
  image?: string;
  url?: string;
  type?: 'website' | 'product';
}

/**
 * Компонент для обновления мета-тегов
 * Примечание: для полноценной работы рекомендуется react-helmet-async
 */
export const useMetaTags = ({ title, description, image, url, type = 'website' }: MetaTagsProps) => {
  // Обновляем title
  if (typeof document !== 'undefined') {
    document.title = title;
    
    // Обновляем meta description
    let metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', description);
    }

    // Обновляем OG теги
    const updateOgTag = (property: string, content: string) => {
      let tag = document.querySelector(`meta[property="${property}"]`);
      if (tag) {
        tag.setAttribute('content', content);
      }
    };

    updateOgTag('og:title', title);
    updateOgTag('og:description', description);
    if (image) updateOgTag('og:image', image);
    if (url) updateOgTag('og:url', url);
    updateOgTag('og:type', type);
  }
};

export default ProductSchema;
