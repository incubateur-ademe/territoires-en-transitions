// copie du composant du même nom dans l'app
// TODO: à mutualiser dans le package ui ?

import classNames from 'classnames';
import { ElementType } from 'react';
import MarkdownBase, { Options } from 'react-markdown';
import rehypeExternalLinks from 'rehype-external-links';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';

// pour enlever les espaces en trop
const RE_CLEANUP_EXTRA_SPACES = / +/gm;
// pour enlever les sauts de ligne en trop entre les items listes
const RE_CLEANUP_EXTRA_LINES = /^ {0,1}- (.*)$(?:\n ?){2,}/gm;

function cleanupMarkdownContent(content: string) {
  return content
    ?.replaceAll(RE_CLEANUP_EXTRA_SPACES, ' ')
    .replaceAll(RE_CLEANUP_EXTRA_LINES, ' - $1\n');
}

interface MarkdownProps<T extends ElementType> {
  // container utilisé (par défaut `div`)
  as?: T;
  // contenu au format md
  texte: string;
  // classes supplémentaires appliquées au container
  className?: string;
  // options pour le composant react-markdown
  options?: Options;
  // force l'ouverture des liens dans un nouvel onglet
  openLinksInNewTab?: boolean;
}

const Markdown = <T extends ElementType = 'div'>({
  as,
  texte: content,
  className,
  options,
  openLinksInNewTab,
}: MarkdownProps<T> &
  Omit<React.ComponentPropsWithoutRef<T>, keyof MarkdownProps<T>>) => {
  const Wrapper = as || 'div';

  const rehypePlugins: Options['rehypePlugins'] = [rehypeRaw];
  if (openLinksInNewTab) {
    rehypePlugins.push([
      // @ts-expect-error rehypeExternalLinks génère une erreur de typage mais c'est bien ok
      rehypeExternalLinks,
      { rel: ['noreferrer', 'noopener'], target: '_blank' },
    ]);
  }

  return (
    <Wrapper
      className={classNames(
        `
    [&_ul]:list-disc [&_ul]:list-inside [&_ul]:pl-4
    [&_ol]:list-inside [&_ol]:pl-4
    [&>*:last-child]:mb-0
    [&_li_p]:inline
    `,
        className
      )}
    >
      <MarkdownBase
        rehypePlugins={rehypePlugins}
        remarkPlugins={[remarkGfm]}
        {...options}
      >
        {cleanupMarkdownContent(content)}
      </MarkdownBase>
    </Wrapper>
  );
};

export default Markdown;
