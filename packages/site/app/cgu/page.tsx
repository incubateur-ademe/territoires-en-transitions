'use server';

import Section from '@tet/site/components/sections/Section';
import { Metadata } from 'next';
import CGU from './cgu.mdx';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'CGU',
  };
}

export default async function Page() {
  return (
    <Section>
      <h1 className="fr-header__body">Conditions générales d’utilisation</h1>
      <CGU />
    </Section>
  );
}
