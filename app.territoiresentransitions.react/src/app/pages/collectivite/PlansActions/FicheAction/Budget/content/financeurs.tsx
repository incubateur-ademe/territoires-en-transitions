import BudgetTagsList from '@/app/app/pages/collectivite/PlansActions/FicheAction/Budget/content/budget-tags-list';
import FinanceursModal from '@/app/app/pages/collectivite/PlansActions/FicheAction/Budget/modals/financeurs-modal';
import { FicheShareProperties } from '@/app/plans/fiches/share-fiche/fiche-share-properties.dto';
import { FicheWithRelations, Financeur } from '@/domain/plans/fiches';
import { Button } from '@/ui';
import { useState } from 'react';

type FinanceursProps = {
  fiche: Pick<FicheWithRelations, 'financeurs'> & FicheShareProperties;
  isReadonly?: boolean;
  updateFinanceurs: (financeurs: Financeur[] | null | undefined) => void;
};

const Financeurs = ({
  fiche,
  isReadonly = true,
  updateFinanceurs,
}: FinanceursProps) => {
  const financeurs = fiche.financeurs;
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {financeurs && financeurs.length > 0 ? (
        // Vue remplie
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <span className="uppercase text-primary-9 text-sm font-bold leading-7">
              Financeurs :
            </span>
            {!isReadonly && (
              <Button
                title="Modifier les financeurs"
                icon="edit-line"
                size="xs"
                variant="grey"
                disabled={isReadonly}
                onClick={() => setIsOpen(true)}
              />
            )}
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-2">
            <BudgetTagsList
              tags={financeurs.map((f) => ({
                name: f.financeurTag.nom,
                amount: f.montantTtc,
              }))}
            />
          </div>
        </div>
      ) : (
        // Vue vide
        <div className="flex justify-between items-center">
          <div>
            <span className="uppercase text-primary-9 text-sm font-bold leading-7">
              Financeurs :{' '}
            </span>
            <span className="text-sm text-grey-7 leading-7">
              Non renseignés
            </span>
          </div>
          {!isReadonly && (
            <Button
              title="Modifier les financeurs"
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
        <FinanceursModal
          openState={{ isOpen, setIsOpen }}
          fiche={fiche}
          updateFinanceurs={updateFinanceurs}
        />
      )}
    </>
  );
};

export default Financeurs;
