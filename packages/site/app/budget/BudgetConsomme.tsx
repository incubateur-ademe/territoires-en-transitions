import InfoTva, { InfoTvaProps } from './InfoTva';
import TableauBudget from './TableauBudget';
import RepartitionCouts from './RepartitionCouts';
import DescriptionCouts, { DescriptionCoutsProps } from './DescriptionCouts';
import { TTableauBudget } from './utils';
import Markdown from '@tet/site/components/markdown/Markdown';

type BudgetConsommeProps = {
  titre: string;
  description: string;
  tableau: TTableauBudget;
  repartitionCouts: {
    titre: string;
  };
  descriptionCouts: DescriptionCoutsProps;
  infoTva: InfoTvaProps;
};

const BudgetConsomme = ({
  titre,
  description,
  tableau,
  repartitionCouts,
  descriptionCouts,
  infoTva,
}: BudgetConsommeProps) => {
  return (
    <div className="bg-white md:rounded-[10px] py-8 md:py-12 px-6 md:px-10">
      <h2 className="text-primary-9">{titre}</h2>
      {/* <p className="paragraphe-16 text-primary-11 mb-8">{description}</p> */}
      <Markdown
        texte={description}
        className="paragraphe-16 paragraphe-primary-11"
      />

      <TableauBudget data={tableau} />

      <RepartitionCouts {...repartitionCouts} data={tableau} />

      <DescriptionCouts {...descriptionCouts} />

      <InfoTva {...infoTva} />
    </div>
  );
};

export default BudgetConsomme;
