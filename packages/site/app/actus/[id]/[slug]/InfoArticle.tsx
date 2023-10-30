import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type InfoArticleProps = {
  texte: string;
};

const InfoArticle = ({texte}: InfoArticleProps) => {
  return (
    <Markdown
      remarkPlugins={[remarkGfm]}
      className="fr-callout w-full bg-[#f5f5fe] my-8"
    >
      {texte}
    </Markdown>
  );
};

export default InfoArticle;
