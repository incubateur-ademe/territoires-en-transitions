import { Header } from '@/app/app/Layout/Header/Header';
import { FooterTeT } from '@/ui';
import { ReactNode } from 'react';

export default async function Layout({ children }: { children: ReactNode }) {
  return (
    <>
      <Header user={null} currentCollectivite={null} panierId={undefined} />
      {children}
      <FooterTeT id="footer" />
    </>
  );
}
