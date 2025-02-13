import { ActionPage } from './action.page';

export default async function Page({
  params,
}: {
  params: Promise<{ actionId: string }>;
}) {
  const { actionId } = await params;
  return <ActionPage actionId={actionId} />;
}
