import { ActionProvider } from '@/app/referentiels/actions/action-context';
import { ReactNode } from 'react';

export default async function Layout({
  params,
  tabs,
}: {
  params: Promise<{ actionId: string }>;
  tabs: ReactNode;
}) {
  const { actionId } = await params;
  return <ActionProvider actionId={actionId}>{tabs}</ActionProvider>;
}
