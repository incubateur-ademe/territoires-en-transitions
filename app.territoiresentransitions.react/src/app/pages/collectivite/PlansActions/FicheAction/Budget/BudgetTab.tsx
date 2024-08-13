import {useState} from 'react';
import classNames from 'classnames';
import {Button} from '@tet/ui';
import {FicheAction} from '../data/types';
import EmptyCard from '../EmptyCard';
import MoneyPicto from './MoneyPicto';
import ModaleBudget from './ModaleBudget';
import FinanceursListe from './FinanceursListe';
import BudgetBadge from './BudgetBadge';

export const getFormattedNumber = (nb: number) => {
  return nb.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
};

type BudgetTabProps = {
  isReadonly: boolean;
  fiche: FicheAction;
  updateFiche: (fiche: FicheAction) => void;
};

const BudgetTab = ({isReadonly, fiche, updateFiche}: BudgetTabProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const {
    budget_previsionnel: budgetPrevisionnel,
    financeurs,
    financements,
  } = fiche;

  const isEmpty =
    budgetPrevisionnel === null &&
    (!financeurs || financeurs.length === 0) &&
    !financements;

  return (
    <>
      {isEmpty ? (
        <EmptyCard
          picto={className => <MoneyPicto className={className} />}
          title="Budget non renseigné !"
          subTitle="Renseignez le budget prévisionnel de l'action, ainsi que les détails de financements"
          isReadonly={isReadonly}
          action={{
            label: 'Renseigner un budget',
            onClick: () => setIsModalOpen(true),
          }}
        />
      ) : (
        <div className="bg-white border border-grey-3 rounded-lg py-7 lg:py-8 px-5 lg:px-6 xl:px-7 flex flex-col gap-5">
          {/* Titre et bouton d'édition */}
          <div className="flex justify-between">
            <h5 className="text-primary-8 mb-0">Budget</h5>
            {!isReadonly && (
              <Button
                title="Modifier le budget"
                icon="edit-line"
                size="xs"
                variant="grey"
                onClick={() => setIsModalOpen(true)}
              />
            )}
          </div>

          {/* Budget prévisionnel total */}
          <div className="flex gap-3">
            <span className="uppercase text-primary-9 text-sm font-bold leading-7">
              Budget prévisionnel total :
            </span>
            {budgetPrevisionnel !== null ? (
              <BudgetBadge budgetPrevisionnel={budgetPrevisionnel} />
            ) : (
              <span className="text-sm text-grey-7 leading-7">
                Non renseigné
              </span>
            )}
          </div>

          {/* Financeurs */}
          <div className="flex gap-x-3 gap-y-2 flex-wrap">
            <span className="uppercase text-primary-9 text-sm font-bold leading-7">
              Financeurs :
            </span>
            {financeurs && financeurs.length ? (
              <FinanceursListe financeurs={financeurs} />
            ) : (
              <span className="text-sm text-grey-7 leading-7">
                Non renseignés
              </span>
            )}
          </div>

          {/* Financements */}
          <div
            className={classNames({
              'flex flex-col gap-1': financements && financements.length,
            })}
          >
            <span className="uppercase text-primary-9 text-sm font-bold leading-7">
              Financements :
            </span>

            <p
              className={classNames(
                'mb-0 text-sm leading-6 whitespace-pre-wrap',
                {
                  'text-primary-10': !!financements && financements.length > 0,
                  'text-grey-7': !financements || financements.length === 0,
                }
              )}
            >
              {financements && financements.length
                ? financements
                : 'Coûts unitaires, fonctionnement, investissement, recettes attendues, subventions…'}
            </p>
          </div>
        </div>
      )}

      <ModaleBudget
        isOpen={isModalOpen && !isReadonly}
        setIsOpen={setIsModalOpen}
        fiche={fiche}
        updateFiche={updateFiche}
      />
    </>
  );
};

export default BudgetTab;
