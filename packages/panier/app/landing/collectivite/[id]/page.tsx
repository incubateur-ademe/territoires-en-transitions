import { TrackPageView } from '@/ui';
import Landing from '@tet/panier/components/Landing';

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
