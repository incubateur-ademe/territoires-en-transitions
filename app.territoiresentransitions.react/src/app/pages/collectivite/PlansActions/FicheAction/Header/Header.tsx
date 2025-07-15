import { useCollectiviteId } from '@/api/collectivites';
import { Fiche } from '@/app/app/pages/collectivite/PlansActions/FicheAction/data/use-get-fiche';
import { Divider, Icon } from '@/ui';
import { format } from 'date-fns';
import CheminsFiche from './CheminsFiche';
import TitreFiche from './TitreFiche';
import Toolbar from './actions/toolbar';

type FicheActionHeaderProps = {
  fiche: Fiche;
  isReadonly: boolean;
  updateTitle: (value: string | null) => void;
};

const Header = ({ fiche, updateTitle, isReadonly }: FicheActionHeaderProps) => {
  const { titre, axes, modifiedBy, modifiedAt, createdBy, createdAt } = fiche;

  const collectiviteId = useCollectiviteId();

  const displayCreationInfo = createdBy || createdAt;
  const displayModificationInfo =
    (modifiedBy || modifiedAt) && modifiedAt !== createdAt;

  const displayInfoSection = displayCreationInfo || displayModificationInfo;

  return (
    <div className="w-full mb-6" data-test="fiche-header">
      <div className="flex flex-col-reverse gap-4 lg:flex-row lg:items-start">
        {/* Titre éditable de la fiche action */}
        <TitreFiche
          titre={titre}
          isReadonly={isReadonly}
          updateTitle={updateTitle}
        />

        {/* Actions génériques de la fiche action */}
        <Toolbar
          fiche={fiche}
          isReadonly={isReadonly}
          collectiviteId={collectiviteId}
        />
      </div>

      {/* Fils d'ariane avec emplacements de la fiche */}
      <CheminsFiche titre={titre} collectiviteId={collectiviteId} axes={axes} />

      {/* Infos de création et de modification de la fiche */}
      {displayInfoSection ? (
        <div className="flex max-md:flex-col gap-3 items-center mt-3 mb-4 py-3 text-sm text-grey-8 border-y border-primary-3">
          {displayModificationInfo && (
            <span>
              <Icon icon="calendar-2-line" size="sm" className="mr-1" />
              Modifiée{' '}
              {modifiedAt
                ? `le ${format(new Date(modifiedAt), 'dd/MM/yyyy')}`
                : ''}{' '}
              {modifiedBy ? `par ${modifiedBy?.prenom} ${modifiedBy?.nom}` : ''}
            </span>
          )}

          {displayCreationInfo && (
            <>
              {displayModificationInfo && (
                <div className="max-md:hidden w-[1px] h-5 bg-grey-5" />
              )}
              <span>
                <Icon icon="file-add-line" size="sm" className="mr-1" />
                Créée{' '}
                {createdAt
                  ? `le ${format(new Date(createdAt), 'dd/MM/yyyy')}`
                  : ''}{' '}
                {createdBy
                  ? `par ${fiche.createdBy?.prenom} ${createdBy?.nom}`
                  : ''}
              </span>
            </>
          )}
        </div>
      ) : (
        <Divider className="mt-4" />
      )}
    </div>
  );
};

export default Header;
