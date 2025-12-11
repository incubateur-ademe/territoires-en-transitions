import { useUpdateFiche } from '@/app/plans/fiches/update-fiche/data/use-update-fiche';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { FicheBudget, FicheWithRelations } from '@tet/domain/plans';
import { EmptyCard } from '@tet/ui';
import { useState } from 'react';
import { MoneyPicto } from '../components/MoneyPicto';
import { useGetBudget } from '../data/use-get-budget';
import { MoyensContent } from './moyens.content';
import { MoyensModals, type ModalType } from './moyens.modals';

type MoyensViewProps = {
  isReadonly: boolean;
  fiche: FicheWithRelations;
};

type EmptyMoyensViewProps = {
  isReadonly: boolean;
  setOpenModalType: (modalType: ModalType) => void;
};

const EmptyMoyensView = ({
  isReadonly,
  setOpenModalType,
}: EmptyMoyensViewProps) => {
  return (
    <EmptyCard
      picto={(props) => <MoneyPicto {...props} />}
      title="Moyens"
      isReadonly={isReadonly}
      actions={[
        {
          children: 'Détailler les moyens humains et techniques',
          onClick: () => setOpenModalType('resources'),
        },
        {
          children: "Compléter le budget d'investissement",
          onClick: () => setOpenModalType('investissement'),
        },
        {
          children: 'Compléter le budget de fonctionnement',
          onClick: () => setOpenModalType('fonctionnement'),
        },
        {
          children: 'Ajouter des financeurs',
          variant: 'outlined',
          onClick: () => setOpenModalType('financeurs'),
        },
        {
          children: 'Détailler les financements',
          variant: 'outlined',
          onClick: () => setOpenModalType('financements'),
        },
      ]}
      size="xs"
    />
  );
};
const isBudgetEmpty = (budgets: FicheBudget[]) => {
  if (!budgets) return true;
  if (budgets.length === 0) return true;
  return budgets.every(
    (budget) => budget.budgetPrevisionnel === null && budget.budgetReel === null
  );
};

export const MoyensView = ({ isReadonly, fiche }: MoyensViewProps) => {
  const [openModalType, setOpenModalType] = useState<ModalType>(null);
  const { mutate: updateFiche } = useUpdateFiche();

  const { financeurs, financements } = fiche;
  const { data: budgets, isLoading: isBudgetLoading } = useGetBudget({
    ficheId: fiche.id,
  });

  if (isBudgetLoading) {
    return <SpinnerLoader className="mx-auto my-8" />;
  }

  const hasBudgets = budgets && isBudgetEmpty(budgets) === false;
  const hasFinanceurs = !!financeurs && financeurs.length !== 0;
  const hasFinancements = !!financements && financements.length !== 0;
  const hasRessources =
    !!fiche.ressources && fiche.ressources.trim().length !== 0;

  const hasFicheMoyensRelatedData =
    hasBudgets || hasFinanceurs || hasFinancements || hasRessources;
  return (
    <>
      {hasFicheMoyensRelatedData ? (
        <MoyensContent
          fiche={fiche}
          budgets={budgets ?? []}
          isReadonly={isReadonly}
          onEdit={setOpenModalType}
        />
      ) : (
        <EmptyMoyensView
          isReadonly={isReadonly}
          setOpenModalType={setOpenModalType}
        />
      )}
      <MoyensModals
        type={openModalType}
        onClose={() => setOpenModalType(null)}
        fiche={fiche}
        budgets={budgets ?? []}
        updateFiche={updateFiche}
      />
    </>
  );
};
