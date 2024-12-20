import { format } from 'date-fns';

import { FicheAction } from '@/api/plan-actions';

import { Divider, Icon } from '@/ui';

import ExportFicheActionButton from '@/app/app/pages/collectivite/PlansActions/ExportPdf/ExportFicheActionButton';

import CheminsFiche from './CheminsFiche';
import TitreFiche from './TitreFiche';
import ModaleEmplacement from './actions/EmplacementFiche/ModaleEmplacement';
import ModaleSuppression from './actions/ModaleSuppression';

type FicheActionHeaderProps = {
  fiche: FicheAction;
  isReadonly: boolean;
  updateTitle: (value: string | null) => void;
};

const Header = ({ fiche, updateTitle, isReadonly }: FicheActionHeaderProps) => {
  const { titre, collectiviteId, axes } = fiche;

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
        <div className="flex gap-4 lg:mt-3.5">
          <ModaleEmplacement fiche={fiche} />
          <ExportFicheActionButton fiche={fiche} />
          <ModaleSuppression
            ficheId={fiche.id}
            title={titre}
            isInMultipleAxes={!!axes && axes.length > 1}
            buttonClassName="!border-error-1 hover:!border-error-1"
            redirect
          />
        </div>
      </div>

      {/* Fils d'ariane avec emplacements de la fiche */}
      <CheminsFiche titre={titre} collectiviteId={collectiviteId} axes={axes} />

      {/* Création et modification de la fiche */}
      {fiche.modifiedBy ||
      fiche.createdBy ||
      fiche.modifiedAt ||
      fiche.createdAt ? (
        <div className="flex max-md:flex-col gap-2 items-center mt-3 mb-4 py-3 text-sm text-grey-8 border-y boder-primary-3">
          <div className="flex gap-1">
            <Icon icon="calendar-2-line" size="sm" />
            Modifiée{' '}
            {fiche.modifiedAt
              ? `le ${format(new Date(fiche.modifiedAt), 'dd/MM/yyyy')}`
              : ''}{' '}
            {fiche.modifiedBy
              ? `par ${fiche.modifiedBy?.prenom} ${fiche.modifiedBy?.nom}`
              : ''}
          </div>
          <div className="max-md:hidden w-[1px] h-5 bg-grey-5" />
          <div className="flex gap-1">
            <Icon icon="file-add-line" size="sm" />
            Créée{' '}
            {fiche.createdAt
              ? `le ${format(new Date(fiche.createdAt), 'dd/MM/yyyy')}`
              : ''}{' '}
            {fiche.createdBy
              ? `par ${fiche.createdBy?.prenom} ${fiche.createdBy?.nom}`
              : ''}
          </div>
        </div>
      ) : (
        <Divider className="mt-4" />
      )}
    </div>
  );
};

export default Header;
