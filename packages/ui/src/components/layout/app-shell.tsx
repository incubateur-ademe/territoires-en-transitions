import { ReactNode } from 'react';
import { VisibleWhen } from '../../design-system/VisibleWhen';
import { cn } from '../../utils/cn';

export type AppShellProps = {
  header: ReactNode;
  footer: ReactNode;
  /** Panneau latéral, rendu sticky à droite par-dessus le header. */
  sidePanel?: ReactNode;
  isSidePanelOpen?: boolean;
  /** Contenu affiché sous le footer, hors du conteneur de page. */
  belowFooter?: ReactNode;
  children: ReactNode;
};

/**
 * Coque présentationnelle des pages de l'app : header, conteneur de page,
 * footer et panneau latéral. Sans état ni donnée, elle est partagée entre
 * l'app et les prototypes pour que le cadre d'une page y soit identique.
 *
 * Grille à 2 colonnes : `header` en pleine largeur, `main + footer` à gauche
 * dessous, `sidePanel` sticky à droite par-dessus le header.
 * Les `grid-template-columns` s'animent entre l'état fermé (`1fr 0`) et
 * ouvert (`1fr <side-panel-width>`), ce qui produit le slide-in du panel à
 * largeur fixe.
 */
export const AppShell = ({
  header,
  footer,
  sidePanel,
  isSidePanelOpen = false,
  belowFooter,
  children,
}: AppShellProps) => (
  <div
    className={cn(
      'min-h-screen grid grid-cols-[1fr_0] grid-rows-[auto_1fr] overflow-x-clip transition-all duration-500',
      isSidePanelOpen && 'grid-cols-[0_100vw] lg:grid-cols-side-panel-open'
    )}
  >
    <div
      className={cn('col-start-1 col-span-2 row-start-1', {
        'max-lg:hidden': isSidePanelOpen,
      })}
    >
      {header}
    </div>
    <div
      className={cn('col-start-1 row-start-2 flex flex-col min-w-0', {
        'max-lg:hidden': isSidePanelOpen,
      })}
    >
      <div className="grow flex flex-col w-full max-w-8xl mx-auto px-2 md:px-4 lg:px-6 pb-12 pt-6">
        {children}
      </div>
      {footer}
      <VisibleWhen condition={!!belowFooter}>
        <div className="p-4">{belowFooter}</div>
      </VisibleWhen>
    </div>
    <div className="col-start-2 row-start-1 row-span-2">{sidePanel}</div>
  </div>
);
