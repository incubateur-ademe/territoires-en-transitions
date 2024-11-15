'use server';

import { Metadata } from 'next';
import AccessibiliteContent from './AccessibiliteContent';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Accessibilité',
  };
}

export default async function Page() {
  return <AccessibiliteContent />;
}
