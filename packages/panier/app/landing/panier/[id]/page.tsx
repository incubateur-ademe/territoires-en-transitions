import Landing from '@/panier/components/Landing';
import { TrackPageView } from '@/ui';

const Page = () => {
  return (
    <>
      <TrackPageView pageName="panier/landing" />
      <Landing />
    </>
  );
};

export default Page;
