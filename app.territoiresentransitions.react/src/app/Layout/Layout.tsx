import React from 'react';

import Header from 'app/Layout/Header';
import Footer from './Footer';

type Props = {
  children: React.ReactNode;
};

const Layout = ({children}: Props) => {
  return (
    <>
      <Header />
      {children}
      <Footer />
    </>
  );
};

export default Layout;
