'use client';

import { ReactNode } from 'react';

import { ContexteInstructionBanner } from '@/app/demarches/pcaet/instruction/contexte-instruction.banner';
import { Header } from '@/app/ui/layout/header/header';
import { SidePanel } from '@/app/ui/layout/side-panel/side-panel';
import { useSidePanel } from '@/app/ui/layout/side-panel/side-panel.context';
import { AppShell, FooterTeT } from '@tet/ui';
import { OfflineAlert } from './offline-alert';

const ContentWrapper = ({
  children,
  belowFooterSlot,
}: {
  children: ReactNode;
  belowFooterSlot?: ReactNode;
}) => {
  const { panel } = useSidePanel();
  return (
    <AppShell
      header={<Header />}
      footer={<FooterTeT />}
      pageFrame={(page) => (
        <>
          <ContexteInstructionBanner />
          {page}
        </>
      )}
      sidePanel={<SidePanel />}
      isSidePanelOpen={panel.isOpen}
      belowFooter={belowFooterSlot}
    >
      {children}
    </AppShell>
  );
};

export const AppLayout = ({
  children,
  belowFooterSlot,
}: {
  children: ReactNode;
  belowFooterSlot?: ReactNode;
}) => {
  return (
    <>
      <OfflineAlert />
      <ContentWrapper belowFooterSlot={belowFooterSlot}>
        {children}
      </ContentWrapper>
    </>
  );
};
