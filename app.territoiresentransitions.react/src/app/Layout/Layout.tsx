import React from 'react';

import Header from 'app/Layout/Header';
import Footer from './Footer';

type Props = {
  children: React.ReactNode;
};

const Layout = ({children}: Props) => {
  return (
    <div className="overflow-hidden">
      <Header />
      {children}
      <Footer />
    </div>
  );
};

export default Layout;
