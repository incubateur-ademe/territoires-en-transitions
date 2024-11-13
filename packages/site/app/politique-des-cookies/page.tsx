'use server';

import { Metadata } from 'next';
import CookiesContent from './CookiesContent';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Cookies',
  };
}

export default async function Page() {
  return <CookiesContent />;
}
