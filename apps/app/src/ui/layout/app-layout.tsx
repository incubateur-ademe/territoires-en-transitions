'use client';

import { ReactNode } from 'react';

import { Header } from '@/app/ui/layout/header/header';
import { SidePanel } from '@/app/ui/layout/side-panel/side-panel';
import { useSidePanel } from '@/app/ui/layout/side-panel/side-panel.context';
import { cn, FooterTeT, VisibleWhen } from '@tet/ui';
import { OfflineAlert } from './offline-alert';

/**
 * Grille à 2 colonnes : `main + footer` à gauche, `SidePanel` sticky à droite.
 * Les `grid-template-columns` s'animent entre l'état fermé (`1fr 0`) et
 * ouvert (`1fr <side-panel-width>`), ce qui produit le slide-in du panel à
 * largeur fixe.
 */
const ContentWrapper = ({
  children,
  belowFooterSlot,
}: {
  children: ReactNode;
  belowFooterSlot?: ReactNode;
}) => {
  const { panel } = useSidePanel();
  return (
    <div
      className={cn(
        'min-h-screen grid grid-cols-[1fr_0] overflow-x-clip transition-all duration-500',
        panel.isOpen && 'grid-cols-[0_100vw] lg:grid-cols-side-panel-open'
      )}
    >
      <div
        className={cn('flex flex-col min-w-0', {
          'max-lg:hidden': panel.isOpen,
        })}
      >
        <div className="grow flex flex-col w-full max-w-[90rem] mx-auto px-2 md:px-4 lg:px-6 py-12">
          {children}
        </div>
        <FooterTeT />
        <VisibleWhen condition={!!belowFooterSlot}>
          <div className="p-4">{belowFooterSlot}</div>
        </VisibleWhen>
      </div>
      <SidePanel />
    </div>
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
      <Header />
      <ContentWrapper belowFooterSlot={belowFooterSlot}>
        {children}
      </ContentWrapper>
    </>
  );
};
