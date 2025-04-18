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
      [&_ul]:list-disc [&_ul]:pl-6
      [&_ol]:pl-6
      [&>*:last-child]:mb-0
      `,
      className
    )}
  >
    {texte}
  </MarkdownBase>
);

export default Markdown;
