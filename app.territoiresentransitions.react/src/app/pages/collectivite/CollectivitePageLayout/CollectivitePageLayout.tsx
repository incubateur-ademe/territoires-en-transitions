import React, {useEffect, useMemo, useState} from 'react';
import SideNavContainer, {SideNavContainerProps} from './SideNavContainer';
import {
  PanelProvider,
  usePanelDispatch,
  usePanelState,
} from './Panel/PanelContext';
import classNames from 'classnames';
import Panel from './Panel/Panel';

type Props = {
  children: React.ReactNode;
  sideNav?: SideNavContainerProps;
  dataTest?: string;
};

const PageLayout = ({children, sideNav, dataTest}: Props) => {
  const [isSideNavOpen, setIsSideNavOpen] = useState(true);

  const panelState = usePanelState();
  const panelDispatch = usePanelDispatch();

  // ferme la side nav quand le panel s'ouvre
  useEffect(() => {
    if (panelState.isOpen) {
      setIsSideNavOpen(false);
    }
  }, [panelState]);

  // ferme le panel quand la side nav s'ouvre
  useEffect(() => {
    if (isSideNavOpen) {
      panelDispatch({type: 'close'});
    }
  }, [isSideNavOpen]);

  const gridCols = useMemo(() => {
    // s'il n'y a pas side nav on ne la prend pas en compte dans la grille
    if (!sideNav) {
      if (panelState.isOpen) {
        return `grid-cols-[minmax(0,_78rem)_24rem]`;
      }
      // Valeur par défaut, une seule colonne
      return 'grid-cols-[minmax(0,_78rem)]';
      // s'il y a une sidenav
    } else {
      if (panelState.isOpen) {
        return `grid-cols-[3rem_minmax(0,_78rem)_24rem] xl:grid-cols-[0_minmax(0,_78rem)_24rem]`;
      }

      if (!isSideNavOpen) {
        return 'grid-cols-[3rem_minmax(0,_78rem)] xl:grid-cols-[0_minmax(0,_78rem)]';
      }

      // Valeur par défaut, la side nav est ouverte
      return 'grid-cols-[21rem_minmax(0,_78rem)]';
    }
  }, [isSideNavOpen, panelState.isOpen]);

  return (
    <div
      data-test={dataTest}
      className={`grid ${gridCols} m-auto xl:max-w-[78rem] xl:px-6`}
    >
      {/** Side nav */}
      {sideNav && (
        <div
          data-test="SideNavigation"
          className={classNames({'xl:-ml-12': !isSideNavOpen})}
        >
          <SideNavContainer
            isOpen={isSideNavOpen}
            setIsOpen={isOpen => setIsSideNavOpen(isOpen)}
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

const CollectivitePageLayout = ({children, sideNav, dataTest}: Props) => {
  return (
    <PanelProvider>
      <PageLayout dataTest={dataTest} sideNav={sideNav}>
        {children}
      </PageLayout>
    </PanelProvider>
  );
};

export default CollectivitePageLayout;
