import Markdown from '@/site/components/markdown/Markdown';
import { Alert } from '@/ui';

type InfoArticleProps = {
  texte: string;
};

const InfoArticle = ({ texte }: InfoArticleProps) => (
  <Alert
    description={<Markdown texte={texte} className="py-6 px-8" />}
    noIcon
  />
);

export default InfoArticle;
