import React from 'react';
import Header from './Header';
import Footer from './Footer';

type Props = {
  children: React.ReactNode;
};

const Layout = ({children}: Props) => {
  return (
    <div
      id="main"
      className="flex flex-col w-screen h-screen overflow-x-hidden overflow-y-auto"
    >
      <Header />
      {children}
      <Footer />
    </div>
  );
};

export default Layout;
