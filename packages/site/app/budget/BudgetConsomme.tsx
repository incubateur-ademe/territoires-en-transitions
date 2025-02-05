import Markdown from '@/site/components/markdown/Markdown';
import DescriptionCouts, { DescriptionCoutsProps } from './DescriptionCouts';
import InfoTva, { InfoTvaProps } from './InfoTva';
import RepartitionCouts from './RepartitionCouts';
import TableauBudget from './TableauBudget';
import { TTableauBudget } from './utils';

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
    <div className="bg-white md:rounded-xl py-8 md:py-12 px-6 md:px-10">
      <h2 className="text-primary-9 mb-10">{titre}</h2>

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
