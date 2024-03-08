import React from 'react';

import Header from './Header';
import Footer from './Footer';

type Props = {
  children: React.ReactNode;
};

const Layout = ({children}: Props) => {
  return (
    <div className="min-h-screen flex flex-col justify-between">
      <div id="main" className="mb-8">
        <Header />
        {children}
      </div>
      <Footer />
    </div>
  );
};

export default Layout;
