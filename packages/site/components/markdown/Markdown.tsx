import MarkdownBase from 'react-markdown';
import remarkGfm from 'remark-gfm';

type MarkdownProps = {
  texte: string;
  className?: string;
};

const Markdown = ({texte, className}: MarkdownProps) => (
  <MarkdownBase remarkPlugins={[remarkGfm]} className={className}>
    {texte}
  </MarkdownBase>
);

export default Markdown;
