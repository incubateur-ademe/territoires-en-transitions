'use client';

import { AccesRestreintGuard } from '@/app/collectivites/acces-restreint.guard';
import { ReactNode } from 'react';

export default function Layout({ children }: { children: ReactNode }) {
  return <AccesRestreintGuard>{children}</AccesRestreintGuard>;
}
