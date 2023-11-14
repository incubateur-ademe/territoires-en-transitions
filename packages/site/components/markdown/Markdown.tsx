import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type CustomMarkdownProps = {
  texte: string;
  className?: string;
};

const CustomMarkdown = ({texte, className}: CustomMarkdownProps) => (
  <Markdown remarkPlugins={[remarkGfm]} className={className}>
    {texte}
  </Markdown>
);

export default CustomMarkdown;
