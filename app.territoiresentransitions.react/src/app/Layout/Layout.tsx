import React, {ReactNode} from 'react';

import Header from 'app/Layout/Header';
import {createPortal} from 'react-dom';
import Footer from './Footer';

type Props = {
  children: React.ReactNode;
};

const RIGHT_PANEL_ID = 'right';

const Layout = ({children}: Props) => {
  return (
    <div className="flex flex-row h-[100vh] overflow-hidden">
      <div className="w-full overflow-y-auto">
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
export const setRightPanelContent = (children: ReactNode) =>
  createPortal(children, document.getElementById(RIGHT_PANEL_ID)!);
