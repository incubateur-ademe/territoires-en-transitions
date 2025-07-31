import Markdown from '@/site/components/markdown/Markdown';

type FonctionnementProps = {
  titre: string;
  description: string;
};

const Fonctionnement = ({ titre, description }: FonctionnementProps) => {
  return (
    <div className="bg-primary-7 md:rounded-xl py-8 md:py-12 px-6 md:px-10">
      <h2 className="text-grey-1">{titre}</h2>
      <Markdown
        texte={description}
        className="paragraphe-16 paragraphe-grey-1 -mb-6"
      />
    </div>
  );
};

export default Fonctionnement;
