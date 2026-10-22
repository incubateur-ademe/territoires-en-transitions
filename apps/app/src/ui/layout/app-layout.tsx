'use client';

import { ReactNode } from 'react';

import { ContexteInstructionBanner } from '@/app/demarches/pcaet/instruction/contexte-instruction.banner';
import { Header } from '@/app/ui/layout/header/header';
import { SidePanel } from '@/app/ui/layout/side-panel/side-panel';
import { useSidePanel } from '@/app/ui/layout/side-panel/side-panel.context';
import { cn, FooterTeT, VisibleWhen } from '@tet/ui';
import { OfflineAlert } from './offline-alert';

/**
 * Grille à 2 colonnes : `header` en pleine largeur, `main + footer` à gauche
 * dessous, `SidePanel` sticky à droite par-dessus le header.
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
        'min-h-screen grid grid-cols-[1fr_0] grid-rows-[auto_1fr] overflow-x-clip transition-all duration-500',
        panel.isOpen && 'grid-cols-[0_100vw] lg:grid-cols-side-panel-open'
      )}
    >
      <div
        className={cn('col-start-1 col-span-2 row-start-1', {
          'max-lg:hidden': panel.isOpen,
        })}
      >
        <Header />
      </div>
      <div
        className={cn('col-start-1 row-start-2 flex flex-col min-w-0', {
          'max-lg:hidden': panel.isOpen,
        })}
      >
        <div className="grow flex flex-col w-full max-w-[90rem] mx-auto px-2 md:px-4 lg:px-6 pb-12 pt-6">
          {children}
        </div>
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
      {/* Au-dessus du header, et collé en haut : l'agent d'un service navigue
          au nom d'un autre, et ce rappel-là ne doit pas défiler avec la page. */}
      <ContexteInstructionBanner />
      <ContentWrapper belowFooterSlot={belowFooterSlot}>
        {children}
      </ContentWrapper>
    </>
  );
};
