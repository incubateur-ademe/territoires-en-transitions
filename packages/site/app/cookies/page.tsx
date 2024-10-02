'use server';

import Section from '@tet/site/components/sections/Section';
import { Metadata } from 'next';
import Cookies from './cookies.mdx';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Cookies',
  };
}

export default async function Page() {
  return (
    <Section>
      <h1 className="fr-header__body">Gestion des cookies</h1>
      <Cookies />
    </Section>
  );
}
