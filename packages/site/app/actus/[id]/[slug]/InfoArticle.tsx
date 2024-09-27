import Markdown from '@tet/site/components/markdown/Markdown';

type InfoArticleProps = {
  texte: string;
};

const InfoArticle = ({ texte }: InfoArticleProps) => (
  <Markdown texte={texte} className="fr-callout w-full bg-[#f5f5fe] my-8" />
);

export default InfoArticle;
