import Footer from '@/app/app/Layout/Footer';
import { Header } from '@/app/app/Layout/Header/Header';
import { ReactNode } from 'react';

export default async function Layout({ children }: { children: ReactNode }) {
  return (
    <>
      <Header user={null} currentCollectivite={null} panierId={undefined} />
      {children}
      <Footer />
    </>
  );
}
