import { signInPath, signUpPath } from '@/app/app/paths';
import { FooterTeT, Header } from '@tet/ui';
import { ReactNode } from 'react';

export default async function Layout({ children }: { children: ReactNode }) {
  return (
    <>
      <Header
        secondaryNav={[
          {
            children: 'Aide',
            href: 'https://aide.territoiresentransitions.fr/fr/',
            icon: 'question-line',
            external: true,
          },
          {
            children: 'Créer un compte',
            href: signUpPath,
            icon: 'add-circle-line',
            dataTest: 'signup',
            prefetch: false,
          },
          {
            children: 'Se connecter',
            href: signInPath,
            icon: 'user-line',
            dataTest: 'signin',
            prefetch: false,
          },
        ]}
      />
      {children}
      <FooterTeT id="footer" />
    </>
  );
}
