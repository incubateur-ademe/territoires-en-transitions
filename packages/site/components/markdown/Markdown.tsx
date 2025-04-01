import classNames from 'classnames';
import MarkdownBase from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';

type MarkdownProps = {
  texte: string;
  className?: string;
};

const Markdown = ({ texte, className }: MarkdownProps) => (
  <MarkdownBase
    rehypePlugins={[rehypeRaw]}
    remarkPlugins={[remarkGfm]}
    className={classNames(
      `
      [&_ul]:list-disc [&_ul]:list-inside [&_ul]:pl-4
      [&_ol]:list-inside [&_ol]:pl-4
      [&>*:last-child]:mb-0
      `,
      className
    )}
  >
    {texte}
  </MarkdownBase>
);

export default Markdown;
