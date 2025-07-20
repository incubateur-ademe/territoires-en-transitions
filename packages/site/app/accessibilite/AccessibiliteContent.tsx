'use client';

import Markdown from '@/site/components/markdown/Markdown';
import Section from '@/site/components/sections/Section';

const AccessibiliteContent = ({ content }: { content: string }) => {
  return (
    <Section>
      <h1 className="fr-header__body">Déclaration d’accessibilité</h1>
      <Markdown texte={content} openLinksInNewTab />
    </Section>
  );
};

export default AccessibiliteContent;
