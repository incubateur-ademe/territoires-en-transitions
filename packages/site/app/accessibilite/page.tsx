'use server';

import Section from '@tet/site/components/sections/Section';
import { Metadata } from 'next';
import Content from './accessibilite.mdx';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Accessibilité',
  };
}

export default async function Page() {
  return (
    <Section>
      <h1 className="fr-header__body">Déclaration d’accessibilité</h1>
      <Content />
    </Section>
  );
}
