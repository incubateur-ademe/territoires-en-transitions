import Landing from '@/panier/components/Landing';
import { PostHogPageView } from '@tet/ui';

const Page = () => {
  return (
    <>
      <PostHogPageView />
      <Landing />
    </>
  );
};

export default Page;
