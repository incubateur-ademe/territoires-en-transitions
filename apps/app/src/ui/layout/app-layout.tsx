'use client';

import { ReactNode } from 'react';

import { AppMainNav, Header } from '@/app/ui/layout/header/header';
import { SidePanel } from '@/app/ui/layout/side-panel/side-panel';
import { useSidePanel } from '@/app/ui/layout/side-panel/side-panel.context';
import { useVisitMode } from '@/app/ui/layout/visit-mode/use-visit-mode';
import { VisitModeFrame } from '@/app/ui/layout/visit-mode/visit-mode.frame';
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
  const visit = useVisitMode();

  return (
    <AppShell
      header={<Header isMainNavDetached={!!visit} />}
      footer={<FooterTeT />}
      pageFrame={
        visit
          ? (page) => (
              <VisitModeFrame visit={visit} nav={<AppMainNav />}>
                {page}
              </VisitModeFrame>
            )
          : undefined
      }
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
