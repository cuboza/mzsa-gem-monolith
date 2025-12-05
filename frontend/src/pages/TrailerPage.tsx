import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Trailer } from '../types';
import { db } from '../services/api';
import { TrailerDetailsModal } from '../components/TrailerDetailsModal';
import { BreadcrumbSchema, ProductSchema, useMetaTags } from '../components/common';
import { getMainImage } from '../features/trailers';
import { useEffect } from 'react';

export const TrailerPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [trailer, setTrailer] = useState<Trailer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!id) {
        setLoading(false);
        return;
      }
      try {
        const data = await db.getTrailer(id);
        setTrailer(data);
      } catch (err) {
        console.error('Failed to load trailer', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  if (!trailer) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center space-y-3">
        <p className="text-2xl font-bold text-gray-800">Прицеп не найден</p>
        <p className="text-gray-500">Возможно, модель скрыта или удалена.</p>
        <button
          onClick={() => navigate('/catalog')}
          className="mt-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
        >
          Вернуться в каталог
        </button>
      </div>
    );
  }

  const breadcrumbs = useMemo(() => ([
    { name: 'Главная', url: '/' },
    { name: 'Каталог', url: '/catalog' },
    { name: trailer.model },
  ]), [trailer.model]);

  const image = getMainImage(trailer);
  const pageTitle = `${trailer.model} — ${trailer.name}`;
  useMetaTags({
    title: pageTitle,
    description: trailer.description || `Прицеп ${trailer.model} от официального дилера МЗСА`,
    image,
    url: typeof window !== 'undefined' ? window.location.href : undefined,
    type: 'product',
  });

  useEffect(() => {
    if (typeof document === 'undefined' || typeof window === 'undefined') return;
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', window.location.href);
  }, [trailer]);

  return (
    <>
      <BreadcrumbSchema items={breadcrumbs} />
      <ProductSchema trailer={trailer} />
      <div className="bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4 py-4">
          <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
            <button onClick={() => navigate(-1)} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Назад
            </button>
            <span className="mx-2 text-gray-300">/</span>
            <span className="font-semibold text-gray-700 dark:text-gray-200">{trailer.model}</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4">{pageTitle}</h1>
        </div>
      </div>
      <TrailerDetailsModal
        trailer={trailer}
        onClose={() => navigate(-1)}
        variant="page"
      />
    </>
  );
};
