import { ReactNode } from 'react';

/** Rend `**terme**` en gras dans une ligne de texte */
const renderBoldSegments = (line: string): ReactNode =>
  line
    .split(/\*\*(.+?)\*\*/g)
    .map((part, i) =>
      i % 2 === 1 ? (
        <span className="font-semibold" key={i}>
          {part}
        </span>
      ) : (
        part
      )
    );

/** Affiche une chaîne `appLabels` multi-lignes (une puce "- " par ligne) en `<ul>`. */
export const BulletList = ({ content }: { content: string }) => (
  <ul className="mb-0 list-disc pl-5 space-y-1">
    {content
      .split('\n')
      .filter(Boolean)
      .map((line, i) => (
        <li key={i}>{renderBoldSegments(line.replace(/^- /, ''))}</li>
      ))}
  </ul>
);
