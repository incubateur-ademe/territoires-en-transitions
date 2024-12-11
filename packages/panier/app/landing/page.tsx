import Landing from '@/panier/components/Landing';
import { TrackPageView } from '@/ui';

export default function Page() {
  return (
    <>
      <TrackPageView pageName="panier/landing" />
      <Landing />
    </>
  );
}
