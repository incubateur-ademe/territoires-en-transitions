import { appLabels } from '@/app/labels/catalog';
import { getTextFormattedDate } from '@/app/utils/formatUtils';
import { Modal } from '@tet/ui';
import { JSX } from 'react';

type Author = { prenom?: string | null; nom?: string | null } | null;

const By = ({ author }: { author?: Author }) => {
  if (!author?.prenom && !author?.nom) {
    return null;
  }
  return (
    <>
      {appLabels.parPrenomNom({
        prenom: author.prenom ?? undefined,
        nom: author.nom ?? undefined,
      })}
    </>
  );
};

const Date = ({ date }: { date: string }) => {
  return <>{getTextFormattedDate({ date })}</>;
};

export const ActivityLogModal = ({
  createdAt,
  createdBy,
  modifiedAt,
  modifiedBy,
  onClose,
}: {
  createdAt?: string | null;
  createdBy?: Author;
  modifiedAt?: string | null;
  modifiedBy?: Author;
  onClose: () => void;
}): JSX.Element => {
  return (
    <Modal
      openState={{ isOpen: true, setIsOpen: onClose }}
      onClose={onClose}
      title={appLabels.journalActivites}
      size="lg"
      render={() => (
        <div>
          {createdAt && (
            <div>
              {appLabels.creeeLe} <Date date={createdAt} />{' '}
              <By author={createdBy} />
            </div>
          )}
          {modifiedAt && (
            <div>
              {appLabels.derniereModificationLe} <Date date={modifiedAt} />{' '}
              <By author={modifiedBy} />
            </div>
          )}
        </div>
      )}
    />
  );
};
