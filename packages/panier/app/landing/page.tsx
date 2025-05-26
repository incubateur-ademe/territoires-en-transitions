import Landing from '@/panier/components/Landing';
import { PostHogPageView } from '@/ui';

export default function Page() {
  return (
    <>
      <PostHogPageView />
      <Landing />
    </>
  );
}
