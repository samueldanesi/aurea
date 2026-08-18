import { Suspense } from 'react';
import { mockDashboards } from '@/mocks/data';
import { EmbedDashboardClient } from './embed-client';

// Static export needs every dynamic route's params known at build time --
// the demo only ever serves these fixed mock dashboard ids.
export function generateStaticParams() {
  return mockDashboards.map((d) => ({ id: d.id }));
}

export default async function EmbedDashboardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Suspense fallback={<p className="p-6 text-sm text-gray-400">Caricamento…</p>}>
      <EmbedDashboardClient id={id} />
    </Suspense>
  );
}
