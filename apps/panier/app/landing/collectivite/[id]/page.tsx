import Landing from '@/panier/components/Landing';
import { PostHogPageView } from '@tet/ui';

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <>
      <PostHogPageView properties={{ collectiviteId: parseInt(id) }} />
      <Landing />
    </>
  );
}
