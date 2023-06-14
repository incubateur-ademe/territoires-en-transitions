import React, {useEffect, useMemo, useState} from 'react';
import {SideNavLinks} from 'ui/shared/SideNav';
import SideNavContainer from './SideNavContainer';
import {PanelProvider, usePanelDispatch, usePanelState} from './PanelContext';
import classNames from 'classnames';

type Props = {
  children: React.ReactNode;
  sideNavLinks?: SideNavLinks;
};

const PageLayout = ({children, sideNavLinks}: Props) => {
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
    if (panelState.isOpen) {
      return `grid-cols-[3rem_minmax(0,_78rem)_24rem] xl:grid-cols-[0_minmax(0,_78rem)_24rem]`;
    }

    if (!isSideNavOpen) {
      return 'grid-cols-[3rem_minmax(0,_78rem)] xl:grid-cols-[0_minmax(0,_78rem)]';
    }

    // Valeur par défaut, la side nav est ouverte
    return 'grid-cols-[21rem_minmax(0,_78rem)]';
  }, [isSideNavOpen, panelState.isOpen]);

  return (
    <div className={`grid ${gridCols} m-auto xl:max-w-[78rem] xl:px-6`}>
      {/** Side nav */}
      {sideNavLinks && (
        <div className={classNames({'xl:-ml-12': !isSideNavOpen})}>
          <SideNavContainer
            isOpen={isSideNavOpen}
            setIsOpen={isOpen => setIsSideNavOpen(isOpen)}
            sideNavLinks={sideNavLinks}
          />
        </div>
      )}
      {/** Main */}
      <div>{children}</div>
      {/** Panel */}
      {panelState.isOpen && (
        <div className="sticky inset-y-0 right-0 h-screen w-full border-l border-l-gray-200 bg-white">
          {panelState.content}
        </div>
      )}
    </div>
  );
};

const CollectivitePageLayout = ({children, sideNavLinks}: Props) => {
  return (
    <PanelProvider>
      <PageLayout sideNavLinks={sideNavLinks}>{children}</PageLayout>
    </PanelProvider>
  );
};

export default CollectivitePageLayout;
