import { signInPath, signUpPath } from '@/app/app/paths';
import { FooterTeT, Header } from '@tet/ui';
import { ReactNode } from 'react';
import { RiAddCircleLine, RiQuestionLine, RiUserLine } from '@remixicon/react';

export default async function Layout({ children }: { children: ReactNode }) {
  return (
    <>
      <Header
        secondaryNav={[
          {
            children: 'Aide',
            href: 'https://aide.territoiresentransitions.fr/fr/',
            icon: <RiQuestionLine />,
            external: true,
          },
          {
            children: 'Créer un compte',
            href: signUpPath,
            icon: <RiAddCircleLine />,
            dataTest: 'signup',
            prefetch: false,
          },
          {
            children: 'Se connecter',
            href: signInPath,
            icon: <RiUserLine />,
            dataTest: 'signin',
            prefetch: false,
          },
        ]}
      />
      {children}
      <FooterTeT />
    </>
  );
}
