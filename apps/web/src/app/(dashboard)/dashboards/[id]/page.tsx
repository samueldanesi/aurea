import { mockDashboards } from '@/mocks/data';
import { DashboardDetailClient } from './dashboard-detail-client';

// Static export needs every dynamic route's params known at build time --
// the demo only ever serves these fixed mock dashboard ids.
export function generateStaticParams() {
  return mockDashboards.map((d) => ({ id: d.id }));
}

export default async function DashboardDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <DashboardDetailClient id={id} />;
}
