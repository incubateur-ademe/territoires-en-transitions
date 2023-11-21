/* eslint-disable react/no-unescaped-entities */

import InfoTva from './InfoTva';
import TableauBudget from './TableauBudget';
import RepartitionCouts from './RepartitionCouts';
import DescriptionCouts from './DescriptionCouts';

const BudgetConsomme = () => {
  return (
    <div className="bg-white md:rounded-[10px] py-8 md:py-12 px-6 md:px-10">
      <h2 className="text-primary-9 mb-10">Budget consommé</h2>
      <p className="paragraphe-16 text-primary-11 mb-8">
        Territoires en Transitions est un service en accélération ayant démarré
        son développement en janvier 2021. Le budget présenté est le réel
        consommé sur les années passées. Pour les budgets en cours de
        consommation, c'est le budget prévisionnel en portefeuille qui est
        présenté.
      </p>

      <TableauBudget />

      <RepartitionCouts />

      <DescriptionCouts />

      <InfoTva />
    </div>
  );
};

export default BudgetConsomme;
