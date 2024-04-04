import React from 'react';
import Header from './Header';
import Footer from './Footer';

type Props = {
  children: React.ReactNode;
};

const Layout = ({children}: Props) => {
  return (
    <div className="flex flex-col h-[100vh] overflow-hidden">
      <div id="main" className="w-full overflow-x-hidden overflow-y-auto">
        <Header />
        {children}
        <Footer />
      </div>
    </div>
  );
};

export default Layout;
