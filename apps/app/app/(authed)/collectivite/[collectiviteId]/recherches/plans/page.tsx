import { PlansView } from '@/app/app/pages/CollectivitesEngagees/Views/PlansView';
import { notFound } from 'next/navigation';
import z from 'zod';

export default async function Page({
  params,
}: {
  params: Promise<{ collectiviteId: number }>;
}) {
  const { collectiviteId: rawCollectiviteId } = await params;
  const collectiviteId = z.coerce.number().safeParse(rawCollectiviteId);
  if (!collectiviteId.success) {
    return notFound();
  }
  return <PlansView collectiviteId={collectiviteId.data} />;
}
