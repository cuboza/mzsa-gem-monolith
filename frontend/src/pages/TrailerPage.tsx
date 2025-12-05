import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Trailer } from '../types';
import { db } from '../services/api';
import { TrailerDetailsModal } from '../components/TrailerDetailsModal';

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

  return (
    <TrailerDetailsModal
      trailer={trailer}
      onClose={() => navigate('/catalog')}
    />
  );
};
