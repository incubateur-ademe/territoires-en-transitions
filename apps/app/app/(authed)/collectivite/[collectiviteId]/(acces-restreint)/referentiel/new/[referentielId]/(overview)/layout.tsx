import { ReactNode } from 'react';

export default async function Layout({
  tabs,
  children,
}: {
  tabs: ReactNode;
  children: ReactNode;
}) {
  return (
    <>
      {tabs}
      {children}
    </>
  );
}
