import MarkdownBase from 'react-markdown';
import remarkGfm from 'remark-gfm';

type MarkdownProps = {
  content: string;
  className?: string;
};

const Markdown = ({content, className}: MarkdownProps) => (
  <MarkdownBase remarkPlugins={[remarkGfm]} className={className}>
    {content}
  </MarkdownBase>
);

export default Markdown;
