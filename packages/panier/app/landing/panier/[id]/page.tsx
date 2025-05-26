import Landing from '@/panier/components/Landing';
import { PostHogPageView } from '@/ui';

const Page = () => {
  return (
    <>
      <PostHogPageView />
      <Landing />
    </>
  );
};

export default Page;
