import PageContainer from '@/ui/components/layout/page-container';
import React from 'react';

type Props = {
  children: React.ReactNode;
};

const Layout = ({ children }: Props) => {
  return <PageContainer containerClassName="grow">{children}</PageContainer>;
};

export default Layout;
