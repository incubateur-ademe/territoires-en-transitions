import Landing from '@/panier/components/Landing';
import { TrackPageView } from '@/ui';

export default function Page({ params }: { params: { id: string } }) {
  return (
    <>
      <TrackPageView
        pageName="panier/landing/collectivite"
        properties={{ collectivite_preset: parseInt(params.id) }}
      />
      <Landing />
    </>
  );
}
