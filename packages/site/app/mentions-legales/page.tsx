'use server';

import MentionsLegalesContent from '@/site/app/mentions-legales/mentions-legales.content';
import { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Mentions Légales',
  };
}

export default async function Home() {
  return <MentionsLegalesContent />;
}
