import { fetchCollectiviteNiveauAcces } from '@/api/collectivites/fetch-collectivite-niveau-acces';
import { createClient } from '@/api/utils/supabase/server-client';
import { renderLoader } from '@/app/utils/renderLoader';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { NoSsrLegacyRouter } from './no-ssr-legacy-router';

export default async function Page({
  params,
}: {
  params: Promise<{ collectiviteId: number }>;
}) {
  const { collectiviteId } = await params;
  const supabase = await createClient();
  const collectivite = await fetchCollectiviteNiveauAcces(
    supabase,
    collectiviteId
  );
  if (!collectivite) {
    return notFound();
  }
  return (
    <Suspense fallback={renderLoader()}>
      <NoSsrLegacyRouter collectivite={collectivite} />
    </Suspense>
  );
}
