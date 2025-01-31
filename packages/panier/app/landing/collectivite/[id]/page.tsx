import Landing from '@/panier/components/Landing';
import { TrackPageView } from '@/ui';

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <>
      <TrackPageView
        pageName="panier/landing/collectivite"
        properties={{ collectivite_preset: parseInt(id) }}
      />
      <Landing />
    </>
  );
}
