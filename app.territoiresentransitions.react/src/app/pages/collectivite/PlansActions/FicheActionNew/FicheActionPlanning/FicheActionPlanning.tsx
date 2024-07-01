import classNames from 'classnames';
import {FicheAction} from '../../FicheAction/data/types';
import {Badge, Button, Divider, Icon} from '@tet/ui';
import BadgeStatut from '../../components/BadgeStatut';
import BadgePriorite from '../../components/BadgePriorite';
import FilledCalendarPicto from './FilledCalendarPicto';
import EmtpyCalendarPicto from './EmptyCalendarPicto';
import {useState} from 'react';
import FAPlanningModal from './FAPlanningModal';

const getFormattedDate = (date: string) => {
  return new Date(date).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

type FicheActionPlanningProps = {
  isReadonly: boolean;
  fiche: FicheAction;
  className?: string;
  updateFiche: (fiche: FicheAction) => void;
};

const FicheActionPlanning = ({
  isReadonly,
  fiche,
  className,
  updateFiche,
}: FicheActionPlanningProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const {
    amelioration_continue: ameliorationContinue,
    date_debut: dateDebut,
    date_fin_provisoire: dateFinPrevisionnelle,
    niveau_priorite: niveauPriorite,
    statut,
  } = fiche;

  return (
    <div
      className={classNames(
        'bg-white border border-grey-3 rounded-lg py-10 px-8 flex flex-col items-center gap-7 text-center relative',
        className
      )}
    >
      {!isReadonly && (
        <Button
          icon="edit-line"
          size="xs"
          variant="grey"
          className="absolute top-6 right-6"
          onClick={() => setIsModalOpen(true)}
        />
      )}

      {ameliorationContinue ||
      dateDebut ||
      dateFinPrevisionnelle ||
      niveauPriorite ||
      statut ? (
        <>
          <FilledCalendarPicto className="mx-auto" />

          {/* Date de début */}
          {!!dateDebut && (
            <div>
              <h6 className="text-sm leading-4 text-primary-9 uppercase mb-2">
                Date de début :
              </h6>
              <p className="text-sm leading-4 text-primary-10 mb-0">
                {getFormattedDate(dateDebut)}
              </p>
            </div>
          )}

          {/* Date de fin prévisionnelle */}
          {!!dateFinPrevisionnelle && (
            <div>
              <h6 className="text-sm leading-4 text-primary-9 uppercase mb-2">
                Date de fin prévisionnelle :
              </h6>
              <p className="text-sm leading-4 text-primary-10 mb-0">
                {getFormattedDate(dateFinPrevisionnelle)}
              </p>
            </div>
          )}

          {(((!!dateDebut || !!dateFinPrevisionnelle) &&
            (!!statut || !!niveauPriorite || !!ameliorationContinue)) ||
            !!statut ||
            !!niveauPriorite) && <Divider className="-mb-6" />}

          {/* Statut et niveau de priorité */}
          {(!!statut || !!niveauPriorite) && (
            <div className="flex justify-center gap-4">
              {!!statut && <BadgeStatut statut={statut} />}
              {!!niveauPriorite && <BadgePriorite priorite={niveauPriorite} />}
            </div>
          )}

          {/* Action récurrente */}
          {!!ameliorationContinue && (
            <div className="flex gap-2 justify-center">
              <Icon
                icon="loop-left-line"
                className="text-primary-10"
                size="sm"
              />
              <span className="text-sm text-primary-8">
                l'action se répète tous les ans
              </span>
            </div>
          )}
        </>
      ) : (
        <>
          <EmtpyCalendarPicto className="mx-auto" />

          <p className="text-base text-primary-9 text-center mb-0">
            Date de début | Date de fin prévisionnelle | Statut | Niveau de
            priorité
          </p>

          {!isReadonly && (
            <Button size="xs" onClick={() => setIsModalOpen(true)}>
              Ajouter le planning prévisionnel
            </Button>
          )}
        </>
      )}

      <FAPlanningModal
        isOpen={isModalOpen}
        setIsOpen={setIsModalOpen}
        fiche={fiche}
        updateFiche={updateFiche}
      />
    </div>
  );
};

export default FicheActionPlanning;
