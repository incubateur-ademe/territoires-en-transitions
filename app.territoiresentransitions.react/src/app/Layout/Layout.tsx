import React, {ReactNode} from 'react';
import {createPortal} from 'react-dom';

import Header from './Header';
import Footer from './Footer';

type Props = {
  children: React.ReactNode;
};

const RIGHT_PANEL_ID = 'right';

const Layout = ({children}: Props) => {
  return (
    <div className="flex flex-row h-[100vh] overflow-hidden">
      <div id="main" className="w-full overflow-x-hidden overflow-y-auto">
        <Header />
        {children}
        <Footer />
      </div>
      <aside
        id={RIGHT_PANEL_ID}
        className="shrink-0 max-w-md border-l border-l-gray-200 bg-white"
      />
    </div>
  );
};

export default Layout;

/** Permet de définir le contenu du panneau latéral */
export const setRightPanelContent = (
  children: ReactNode,
  attrs?: {dataTest?: string}
) =>
  createPortal(
    <div
      className="flex flex-col w-[28rem] h-[100vh] fr-pb-6w overflow-hidden"
      data-test={attrs?.dataTest}
    >
      {children}
    </div>,
    document.getElementById(RIGHT_PANEL_ID)!
  );
