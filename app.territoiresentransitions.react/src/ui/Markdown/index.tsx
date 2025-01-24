import MarkdownBase from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';

type MarkdownProps = {
  content: string;
  className?: string;
};

const Markdown = ({ content, className }: MarkdownProps) => (
  <MarkdownBase
    rehypePlugins={[rehypeRaw]}
    remarkPlugins={[remarkGfm]}
    className={className}
  >
    {content}
  </MarkdownBase>
);

export default Markdown;
