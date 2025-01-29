import { ReactNode } from 'react';
import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';

/**
 * Permet de rendre un composant React dans une chaîne
 * (utile pour pouvoir utiliser des composants comme éléments du graphe, pour le
 * contenu des tooltips par exemple)
 */
export const renderToString = (node: ReactNode) => {
  const div = document.createElement('div');
  const root = createRoot(div);
  flushSync(() => {
    root.render(node);
  });
  const html = div.innerHTML;
  root.unmount();
  div.remove();
  return html;
};
