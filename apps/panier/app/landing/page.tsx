import Landing from '@/panier/components/Landing';
import { PostHogPageView } from '@tet/ui';

export default function Page() {
  return (
    <>
      <PostHogPageView />
      <Landing />
    </>
  );
}
