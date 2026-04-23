'use client';

import { useParams, useSearchParams } from 'next/navigation';
import { useEffect, Suspense } from 'react';
import { useFilterStore } from '@/lib/filters';
import ShopPage from '@/app/shop/page';

function CategoryContent() {
  const params = useParams();
  const slug = params.slug as string;
  const { setCategory } = useFilterStore();

  useEffect(() => {
    setCategory(slug);
  }, [slug, setCategory]);

  return <ShopPage />;
}

export default function CategoryPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="skeleton" style={{ width: 200, height: 40, borderRadius: 12 }} />
      </div>
    }>
      <CategoryContent />
    </Suspense>
  );
}
