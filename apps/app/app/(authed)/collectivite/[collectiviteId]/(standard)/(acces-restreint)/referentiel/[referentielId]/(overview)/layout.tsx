import { ReactNode } from 'react';

export default function Layout({
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
