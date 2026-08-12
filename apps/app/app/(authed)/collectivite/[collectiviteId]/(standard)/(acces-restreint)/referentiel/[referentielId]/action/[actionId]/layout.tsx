import { ReactNode } from 'react';

import { ActionProvider } from '@/app/referentiels/actions/action-context';
import { DisplaySettingsProvider } from './_components/display-settings.context';

export default async function Layout({
  params,
  children,
}: {
  params: Promise<{ actionId: string }>;
  children: ReactNode;
}) {
  const { actionId } = await params;

  return (
    <ActionProvider actionId={actionId}>
      <DisplaySettingsProvider>{children}</DisplaySettingsProvider>
    </ActionProvider>
  );
}
