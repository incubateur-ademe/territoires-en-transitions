import BudgetTable from '@/app/app/pages/collectivite/PlansActions/FicheAction/Budget/content/budget-table';
import BudgetTagsList from '@/app/app/pages/collectivite/PlansActions/FicheAction/Budget/content/budget-tags-list';
import { BudgetType } from '@/app/app/pages/collectivite/PlansActions/FicheAction/Budget/hooks/use-get-budget';
import BudgetModal from '@/app/app/pages/collectivite/PlansActions/FicheAction/Budget/modals/budget-modal';
import { FicheShareProperties } from '@/app/plans/fiches/share-fiche/fiche-share-properties.dto';
import { FicheWithRelations } from '@/domain/plans/fiches';
import { Button } from '@/ui';
import { useState } from 'react';

type BudgetProps = {
  fiche: Pick<FicheWithRelations, 'budgets'> & FicheShareProperties;
  type: 'investissement' | 'fonctionnement';
  isReadonly?: boolean;
  budgets: BudgetType[] | undefined;
};

const Budget = (props: BudgetProps) => {
  const { fiche, type, isReadonly } = props;
  const [isOpen, setIsOpen] = useState(false);
  const budgets = (props.budgets?.filter((elt) => elt.type === type) ||
    []) as BudgetType[];

  const extendedBudget = budgets?.filter((elt) => !elt.annee);

  return (
    <>
      {budgets && budgets.length > 0 ? (
        // Vue remplie
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <span className="uppercase text-primary-9 text-sm font-bold leading-7">
              {type === 'investissement'
                ? 'Budget d’investissement : '
                : 'Budget de fonctionnement : '}
            </span>
            {!isReadonly && (
              <Button
                title="Modifier le budget"
                icon="edit-line"
                size="xs"
                variant="grey"
                disabled={isReadonly}
                onClick={() => setIsOpen(true)}
              />
            )}
          </div>
          {extendedBudget.length > 0 ? (
            <>
              <p className="mb-0 text-grey-8 text-sm font-medium">
                Le budget prévisionnel total renseigné{' '}
                {extendedBudget[0].estEtale ? 's’étale' : 'ne s’étale pas'} sur
                toute la durée du plan d’action.
              </p>
              <div className="flex flex-wrap gap-x-3 gap-y-2">
                {extendedBudget.map((b) => (
                  <BudgetTagsList
                    key={b.id}
                    tags={[
                      {
                        name:
                          b.unite === 'HT'
                            ? 'Montant prévisionnel'
                            : 'ETP prévisionnel',
                        amount: b.budgetPrevisionnel
                          ? parseFloat(b.budgetPrevisionnel)
                          : null,
                      },
                      {
                        name: b.unite === 'HT' ? 'Montant dépensé' : 'ETP réel',
                        amount: b.budgetReel ? parseFloat(b.budgetReel) : null,
                      },
                    ]}
                    unit={b.unite}
                  />
                ))}
              </div>
            </>
          ) : (
            <BudgetTable budgets={budgets} />
          )}
        </div>
      ) : (
        // Vue vide
        <div className="flex justify-between items-center">
          <div>
            <span className="uppercase text-primary-9 text-sm font-bold leading-7">
              {type === 'investissement'
                ? 'Budget d’investissement : '
                : 'Budget de fonctionnement : '}
            </span>
            <span className="text-sm text-grey-7 leading-7">Non renseigné</span>
          </div>
          {!isReadonly && (
            <Button
              title="Modifier le budget"
              icon="edit-line"
              size="xs"
              variant="grey"
              disabled={isReadonly}
              onClick={() => setIsOpen(true)}
            />
          )}
        </div>
      )}

      {/* Modale d'édition */}
      {isOpen && (
        <BudgetModal
          openState={{ isOpen, setIsOpen }}
          fiche={fiche}
          type={type}
          budgets={budgets}
        />
      )}
    </>
  );
};

export default Budget;
