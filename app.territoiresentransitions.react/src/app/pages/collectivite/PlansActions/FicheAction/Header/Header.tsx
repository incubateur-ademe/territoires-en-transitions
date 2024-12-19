import { format } from 'date-fns';

import { FicheAction } from '@/api/plan-actions';

import { Icon } from '@/ui';

import CheminsFiche from './CheminsFiche';
import TitreFiche from './TitreFiche';

type FicheActionHeaderProps = {
  fiche: FicheAction;
  isReadonly: boolean;
  updateTitle: (value: string | null) => void;
};

const Header = ({ fiche, updateTitle, isReadonly }: FicheActionHeaderProps) => {
  const { titre, collectiviteId, axes } = fiche;

  return (
    <div className="w-full mb-10" data-test="fiche-header">
      {/* Titre éditable de la fiche action */}
      <TitreFiche
        titre={titre}
        isReadonly={isReadonly}
        updateTitle={updateTitle}
      />

      {/* Fils d'ariane avec emplacements de la fiche */}
      <CheminsFiche titre={titre} collectiviteId={collectiviteId} axes={axes} />

      {/* Création et modification de la fiche */}
      <div className="flex max-md:flex-col gap-2 items-center mt-3 py-3 text-sm text-grey-8 border-y boder-primary-3">
        {fiche.modifiedAt && (
          <div className="flex gap-1">
            <Icon icon="calendar-2-line" size="sm" />
            Modifiée le {format(
              new Date(fiche.modifiedAt),
              'dd/MM/yyyy'
            )} par {fiche.modifiedBy?.prenom} {fiche.modifiedBy?.nom}
          </div>
        )}
        <div className="max-md:hidden w-[1px] h-5 bg-grey-5" />
        {fiche.createdAt && (
          <div className="flex gap-1">
            <Icon icon="file-add-line" size="sm" />
            Créée le {format(new Date(fiche.createdAt), 'dd/MM/yyyy')} par{' '}
            {fiche.createdBy?.prenom} {fiche.createdBy?.nom}
          </div>
        )}
      </div>
    </div>
  );
};

export default Header;
