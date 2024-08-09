'use server';

import Section from '@tet/site/components/sections/Section';
import { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Cookies',
  };
}

export default async function Cookies() {
  return (
    <Section>
      <h1 className="fr-header__body">Gestion des cookies</h1>
      <p>Ce site n&apos;utilise pas de cookie.</p>
      <p>
        Nous sommes ainsi en conformité avec la réglementation « Cookies » de la
        CNIL et exemptés d’autorisation préalable. C’est pour cela que vous
        n’avez pas eu besoin de cliquer sur un bloc pour accepter le dépôt de
        cookies !
      </p>
    </Section>
  );
}
