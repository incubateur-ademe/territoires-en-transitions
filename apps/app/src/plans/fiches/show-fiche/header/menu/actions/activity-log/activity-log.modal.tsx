import { getTextFormattedDate } from '@/app/utils/formatUtils';
import { FicheWithRelations } from '@tet/domain/plans';
import { Modal } from '@tet/ui';
import { JSX } from 'react';

const By = ({ prenom, nom }: { prenom?: string; nom?: string }) => {
  if (!prenom && !nom) {
    return null;
  }
  return (
    <>
      par {prenom} {nom}
    </>
  );
};

const Date = ({ date }: { date: string }) => {
  return <>{getTextFormattedDate({ date })}</>;
};

export const ActivityLogModal = ({
  fiche,
  onClose,
}: {
  fiche: FicheWithRelations;
  onClose: () => void;
}): JSX.Element => {
  return (
    <Modal
      openState={{ isOpen: true, setIsOpen: onClose }}
      onClose={onClose}
      title="Journal d'activités"
      size="lg"
      render={() => (
        <div>
          <div>
            Créée le <Date date={fiche.createdAt} /> <By {...fiche.createdBy} />
          </div>
          <div>
            Dernière modification le <Date date={fiche.modifiedAt} />{' '}
            <By {...fiche.modifiedBy} />
          </div>
        </div>
      )}
    />
  );
};
