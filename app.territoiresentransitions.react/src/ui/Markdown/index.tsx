import classNames from 'classnames';
import { ElementType } from 'react';
import MarkdownBase, { Options } from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';

interface MarkdownProps<T extends ElementType> {
  // container utilisé (par défaut `div`)
  as?: T;
  // contenu au format md
  content: string;
  // classes supplémentaires appliquées au container
  className?: string;
  // options pour le composant react-markdown
  options?: Options;
}

const Markdown = <T extends ElementType = 'div'>({
  as,
  content,
  className,
  options,
}: MarkdownProps<T> &
  Omit<React.ComponentPropsWithoutRef<T>, keyof MarkdownProps<T>>) => {
  const Wrapper = as || 'div';

  return (
    <Wrapper
      className={classNames(
        `
    [&_ul]:list-disc [&_ul]:list-inside [&_ul]:pl-4
    [&_ol]:list-inside [&_ol]:pl-4
    [&>*:last-child]:mb-0
    `,
        className
      )}
    >
      <MarkdownBase
        rehypePlugins={[rehypeRaw]}
        remarkPlugins={[remarkGfm]}
        {...options}
      >
        {content}
      </MarkdownBase>
    </Wrapper>
  );
};

export default Markdown;
