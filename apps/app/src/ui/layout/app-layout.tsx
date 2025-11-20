'use client';

import classNames from 'classnames';
import { usePathname } from 'next/navigation';
import { ReactNode, useEffect } from 'react';

import { Header } from '@/app/ui/layout/header/header';
import { SidePanel } from '@/app/ui/layout/side-panel/side-panel';
import { useSidePanel } from '@/app/ui/layout/side-panel/side-panel.context';
import { useDemoMode } from '@/app/users/demo-mode-support-provider';
import { useUser } from '@tet/api/users';
import { Alert, Checkbox, FooterTeT, useOnlineStatus } from '@tet/ui';

/**
 * Permet de faire matcher la largeur du panneau avec son emplacement dans la grille.
 * On doit faire cela pour que le panneau de commentaires ait une largeur fixe et
 * ne se resize pas avec la grille, ce qui peut faire bug des composants comme les textarea.
 * Je fais comme cela car on ne peut pas utliser `w-[${panelWidthDesktop}]` avec tailwind,
 * bien modifier `gridOpen` si la largeur du panneau change en mobile ou desktop.
 */
export const appLayoutGridClassnames = {
  panel: 'w-[100vw] lg:w-[32rem]',
  gridOpen: '!grid-cols-[0_100vw] lg:!grid-cols-[minmax(0,_90rem)_32rem]',
};

export const AppLayout = ({ children }: { children: ReactNode }) => {
  const { panel, setPanel } = useSidePanel();

  const pathname = usePathname();

  const user = useUser();

  const isOnline = useOnlineStatus();

  const { isDemoMode, toggleDemoMode } = useDemoMode();

  useEffect(() => {
    // A chaque changement de page, on ferme le panneau sauf si la page suivante
    // définit dans isPersistentWithNextPath doit rester ouverte
    if (!panel.isPersistentWithNextPath?.(pathname)) {
      setPanel({ type: 'close' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <>
      {!isOnline && (
        <Alert
          className="sticky top-0 z-tooltip"
          state="error"
          customIcon="cloud-off-line"
          title="Erreur de connexion réseau. Veuillez attendre que votre connexion soit rétablie pour utiliser l'application."
        />
      )}
      <Header />
      {/** min-h-screen ici afin que le footer soit toujours sous le viewport.
       * Idéalement il faudrait enlever la hauteur du header, mais c'est rajouter de la complexité pour pas grand chose. */}
      <div
        className={classNames(
          'min-h-screen grid grid-cols-[minmax(0,_90rem)_0] mx-auto transition-all duration-500',
          { [appLayoutGridClassnames.gridOpen]: panel.isOpen }
        )}
      >
        {/** Page main content */}
        <div
          className={classNames(
            'grow flex flex-col px-2 md:px-4 lg:px-6 py-12',
            {
              'max-lg:invisible': panel.isOpen,
            }
          )}
        >
          {children}
        </div>
        {/** Side panel */}
        {panel.isOpen && <SidePanel />}
      </div>
      <FooterTeT id="footer" />
      {user.isSupport && (
        <div className="w-full max-w-8xl mx-auto px-4 pb-4">
          <Checkbox
            key="checkbox-demo-mode"
            variant="switch"
            label="Mode démo"
            labelClassname="text-sm font-bold"
            checked={isDemoMode}
            onChange={toggleDemoMode}
          />
        </div>
      )}
    </>
  );
};
