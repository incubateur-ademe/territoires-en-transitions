'use server';

import { promises as fs } from 'fs';
import { Metadata } from 'next';
import AccessibiliteContent from './AccessibiliteContent';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Accessibilité',
  };
}

export default async function Page() {
  const content = await fs.readFile(
    `${process.cwd()}/public/accessibilite.md`,
    'utf8'
  );
  return <AccessibiliteContent content={content} />;
}
