import Markdown from '@components/markdown/Markdown';

export type InfoTvaProps = {
  titre: string;
  description: string;
};

const InfoTva = ({titre, description}: InfoTvaProps) => {
  return (
    <div className="fr-notice fr-notice--info bg-info-2 p-6 mt-10 rounded-[10px]">
      <div className="fr-notice__body text-info-1 pr-0">
        <p className="fr-notice__title text-info-1 text-[16px]">{titre}</p>
        <Markdown
          texte={description}
          className="paragraphe-14 paragraphe-info-1 paragraphe-medium -mb-6"
        />
      </div>
    </div>
  );
};

export default InfoTva;
