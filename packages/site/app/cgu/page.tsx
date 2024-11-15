'use server';

import { Metadata } from 'next';
import CguContent from './CguContent';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'CGU',
  };
}

export default async function Page() {
  return <CguContent />;
}
