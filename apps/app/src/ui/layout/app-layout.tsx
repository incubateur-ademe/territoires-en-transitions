'use client';

import { ReactNode } from 'react';

import { AppMainNav, Header } from '@/app/ui/layout/header/header';
import { SidePanel } from '@/app/ui/layout/side-panel/side-panel';
import { useSidePanel } from '@/app/ui/layout/side-panel/side-panel.context';
import { useVisitMode } from '@/app/ui/layout/visit-mode/use-visit-mode';
import { VisitModeFrame } from '@/app/ui/layout/visit-mode/visit-mode.frame';
import { cn, FooterTeT, VisibleWhen } from '@tet/ui';
import { OfflineAlert } from './offline-alert';

/**
 * Grille à 2 colonnes : `header` en pleine largeur, `main + footer` à gauche
 * dessous, `SidePanel` sticky à droite par-dessus le header.
 * Les `grid-template-columns` s'animent entre l'état fermé (`1fr 0`) et
 * ouvert (`1fr <side-panel-width>`), ce qui produit le slide-in du panel à
 * largeur fixe.
 *
 * En visite, la navigation principale quitte le header pour le cadre qui
 * entoure la page ; le footer, qui est celui de la plateforme, reste dehors.
 */
const ContentWrapper = ({
  children,
  belowFooterSlot,
}: {
  children: ReactNode;
  belowFooterSlot?: ReactNode;
}) => {
  const { panel } = useSidePanel();
  const visit = useVisitMode();

  const page = (
    <div className="grow flex flex-col w-full max-w-[90rem] mx-auto px-2 md:px-4 lg:px-6 pb-12 pt-6">
      {children}
    </div>
  );

  return (
    <div
      className={cn(
        'min-h-screen grid grid-cols-[1fr_0] grid-rows-[auto_1fr] overflow-x-clip transition-all duration-500',
        panel.isOpen && 'grid-cols-[0_100vw] lg:grid-cols-side-panel-open'
      )}
    >
      <div
        className={cn('col-start-1 col-span-2 row-start-1', {
          'max-lg:hidden': panel.isOpen,
        })}
      >
        <Header isMainNavDetached={!!visit} />
      </div>
      <div
        className={cn('col-start-1 row-start-2 flex flex-col min-w-0', {
          'max-lg:hidden': panel.isOpen,
        })}
      >
        {visit ? (
          <VisitModeFrame visit={visit} nav={<AppMainNav />}>
            {page}
          </VisitModeFrame>
        ) : (
          page
        )}
        <FooterTeT />
        <VisibleWhen condition={!!belowFooterSlot}>
          <div className="p-4">{belowFooterSlot}</div>
        </VisibleWhen>
      </div>
      <div className="col-start-2 row-start-1 row-span-2">
        <SidePanel />
      </div>
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
      <ContentWrapper belowFooterSlot={belowFooterSlot}>
        {children}
      </ContentWrapper>
    </>
  );
};
