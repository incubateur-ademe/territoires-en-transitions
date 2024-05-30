import MarkdownBase from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

type MarkdownProps = {
  texte: string;
  className?: string;
};

const Markdown = ({texte, className}: MarkdownProps) => (
  <MarkdownBase
    rehypePlugins={[rehypeRaw]}
    remarkPlugins={[remarkGfm]}
    className={className}
  >
    {texte}
  </MarkdownBase>
);

export default Markdown;
