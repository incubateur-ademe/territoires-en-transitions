import FinancementsModal from '@/app/app/pages/collectivite/PlansActions/FicheAction/Budget/modals/financements-modal';
import { FicheShareProperties } from '@/app/plans/fiches/share-fiche/fiche-share-properties.dto';
import { FicheWithRelations } from '@/domain/plans/fiches';
import { Button } from '@/ui';
import { useState } from 'react';

type FinancementsProps = {
  fiche: Pick<FicheWithRelations, 'financements'> & FicheShareProperties;
  isReadonly?: boolean;
  updateFinancements: (financements: string | null | undefined) => void;
};

const Financements = ({
  fiche,
  isReadonly = true,
  updateFinancements,
}: FinancementsProps) => {
  const financements = fiche.financements;
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {financements && financements.length > 0 ? (
        // Vue remplie
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <span className="uppercase text-primary-9 text-sm font-bold leading-7">
              Financements :
            </span>
            {!isReadonly && (
              <Button
                title="Modifier les financements"
                icon="edit-line"
                size="xs"
                variant="grey"
                disabled={isReadonly}
                onClick={() => setIsOpen(true)}
              />
            )}
          </div>
          <p className="mb-0 text-sm leading-6 whitespace-pre-wrap text-primary-10">
            {financements}
          </p>
        </div>
      ) : (
        // Vue vide
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <div>
              <span className="uppercase text-primary-9 text-sm font-bold leading-7">
                Financements :{' '}
              </span>
              <span className="text-sm text-grey-7 leading-7">
                Non renseignés
              </span>
            </div>
            {!isReadonly && (
              <Button
                title="Modifier les financements"
                icon="edit-line"
                size="xs"
                variant="grey"
                disabled={isReadonly}
                onClick={() => setIsOpen(true)}
              />
            )}
          </div>
          <p className="mb-0 text-sm leading-6 whitespace-pre-wrap text-grey-7">
            Coûts unitaires, fonctionnement, investissement, recettes attendues,
            subventions…
          </p>
        </div>
      )}
      {/* Modale d'édition */}
      {isOpen && (
        <FinancementsModal
          openState={{ isOpen, setIsOpen }}
          fiche={fiche}
          updateFinancements={updateFinancements}
        />
      )}
    </>
  );
};

export default Financements;
