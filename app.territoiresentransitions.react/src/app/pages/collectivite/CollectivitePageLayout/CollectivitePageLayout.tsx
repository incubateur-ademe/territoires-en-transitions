'use client';

import classNames from 'classnames';
import React, { useEffect, useMemo, useState } from 'react';
import Panel from './Panel/Panel';
import {
  PanelProvider,
  usePanelDispatch,
  usePanelState,
} from './Panel/PanelContext';
import SideNavContainer, { SideNavContainerProps } from './SideNavContainer';

type Props = {
  children: React.ReactNode;
  sideNav?: SideNavContainerProps;
  dataTest?: string;
  className?: string;
};

const PageLayout = ({ children, sideNav, dataTest, className }: Props) => {
  const [isSideNavOpen, setIsSideNavOpen] = useState(true);

  const panelState = usePanelState();
  const panelDispatch = usePanelDispatch();

  // ferme la side nav quand le panel s'ouvre
  useEffect(() => {
    if (panelState.isOpen) {
      setIsSideNavOpen(false);
    } else {
      setIsSideNavOpen(true);
    }
  }, [panelState]);

  // ferme le panel quand la side nav s'ouvre
  useEffect(() => {
    if (isSideNavOpen) {
      panelDispatch({ type: 'close' });
    }
  }, [isSideNavOpen]);

  const gridCols = useMemo(() => {
    // s'il n'y a pas side nav on ne la prend pas en compte dans la grille
    if (!sideNav) {
      if (panelState.isOpen) {
        return `grid-cols-[minmax(0,_90rem)_24rem]`;
      }
      // Valeur par défaut, une seule colonne
      return 'grid-cols-[minmax(0,_90rem)]';
      // s'il y a une sidenav
    } else {
      if (panelState.isOpen) {
        return `grid-cols-[3rem_minmax(0,_90rem)_24rem] 2xl:grid-cols-[0_minmax(0,_90rem)_24rem]`;
      }

      if (!isSideNavOpen) {
        return 'grid-cols-[3rem_minmax(0,_90rem)] 2xl:grid-cols-[0rem_minmax(0,_90rem)]';
      }

      // Valeur par défaut, la side nav est ouverte
      return 'grid-cols-[21rem_minmax(0,_90rem)]';
    }
  }, [isSideNavOpen, panelState.isOpen]);

  return (
    <div
      data-test={dataTest}
      className={classNames(
        `grid ${gridCols} mx-auto xl:max-w-[90rem] 2xl:px-6`,
        className
      )}
    >
      {/** Side nav */}
      {sideNav && (
        <div
          data-test="SideNavigation"
          className={classNames(
            { '2xl:-ml-12': !isSideNavOpen },
            { 'pl-6 2xl:pl-0': isSideNavOpen }
          )}
        >
          <SideNavContainer
            isOpen={isSideNavOpen}
            setIsOpen={(isOpen) => setIsSideNavOpen(isOpen)}
            sideNav={sideNav}
          />
        </div>
      )}
      {/** Main */}
      <div className="w-full">{children}</div>
      {/** Panel */}
      {panelState.isOpen && <Panel />}
    </div>
  );
};

const CollectivitePageLayout = (props: Props) => {
  return (
    <PanelProvider>
      <PageLayout {...props} />
    </PanelProvider>
  );
};

export default CollectivitePageLayout;
