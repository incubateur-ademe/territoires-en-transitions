import { RepriseTecLayout } from '@/app/demarches/pcaet/reprise-tec/navigation/reprise-tec.layout';
import { ReactNode } from 'react';

export default function Layout({ children }: { children: ReactNode }) {
  return <RepriseTecLayout>{children}</RepriseTecLayout>;
}
