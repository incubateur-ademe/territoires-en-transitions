/* eslint-disable react/no-unescaped-entities */
import Section from '@components/sections/Section';
import Fonctionnement from './Fonctionnement';
import Principes from './Principes';
import ChiffresClefs from './ChiffresClefs';
import BudgetConsomme from './BudgetConsomme';
import PerformanceBudget from './PerformanceBudget';

const Budget = () => {
  return (
    <Section
      containerClassName="grow bg-primary-1 "
      className="max-md:px-0 !gap-0"
    >
      <div className="max-md:px-6 mb-6">
        <h1 className="text-primary-10 text-[25px] mb-4">Budget</h1>
        <h2 className="text-primary-7 text-[42px] md:text-[53px] leading-[24px] mb-8">
          Territoires en Transitions
        </h2>
        <p className="text-primary-10 text-[18px] font-bold mb-10">
          Territoires en Transitions est un service public numérique, c’est
          pourquoi nous sommes transparents sur les ressources allouées et la
          manière dont elles sont employées.
        </p>
      </div>

      <div className="grid grid-cols-3 md:gap-10">
        <div className="col-span-full md:col-span-2 flex flex-col md:gap-10">
          <BudgetConsomme />
          <PerformanceBudget />
        </div>

        <div className="max-lg:order-first col-span-full lg:col-span-1 flex flex-col md:gap-10">
          <Fonctionnement />
          <Principes />
          <ChiffresClefs />
        </div>
      </div>
    </Section>
  );
};

export default Budget;
