import {useState} from 'react';
import classNames from 'classnames';
import {Button, Divider, Icon} from '@tet/ui';
import {FicheAction} from '../../FicheAction/data/types';
import BadgeStatut from '../../components/BadgeStatut';
import BadgePriorite from '../../components/BadgePriorite';
import FilledCalendarPicto from './PictosPlanning/FilledCalendarPicto';
import EmptyCalendarPicto from './PictosPlanning/EmptyCalendarPicto';
import ModalePlanning from './ModalePlanning';
import {getTextFormattedDate} from '../utils';
import EmptyCard from '../EmptyCard';

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
    calendrier: justificationCalendrier,
    date_debut: dateDebut,
    date_fin_provisoire: dateFinPrevisionnelle,
    niveau_priorite: niveauPriorite,
    statut,
  } = fiche;

  const isEmpty =
    !ameliorationContinue &&
    !dateDebut &&
    !dateFinPrevisionnelle &&
    !niveauPriorite &&
    !statut;

  return (
    <>
      {!isEmpty ? (
        <div
          className={classNames(
            'bg-white border border-grey-3 rounded-lg py-7 lg:py-8 xl:py-10 px-5 lg:px-6 xl:px-8 flex flex-col items-center justify-center gap-5 text-center relative',
            className
          )}
        >
          {!isReadonly && (
            <Button
              title="Modifier le planning prévisionnel"
              icon="edit-line"
              size="xs"
              variant="grey"
              className="absolute top-4 right-3"
              onClick={() => setIsModalOpen(true)}
            />
          )}

          <FilledCalendarPicto className="mx-auto" />

          {/* Date de début */}
          {!!dateDebut && (
            <div>
              <h6 className="text-sm leading-4 text-primary-9 uppercase mb-2">
                Date de début
              </h6>
              <p className="text-sm leading-4 text-primary-10 mb-0">
                {getTextFormattedDate(dateDebut)}
              </p>
            </div>
          )}

          {/* Date de fin prévisionnelle */}
          {!!dateFinPrevisionnelle && (
            <div>
              <h6 className="text-sm leading-4 text-primary-9 uppercase mb-2">
                Date de fin prévisionnelle
              </h6>
              <p className="text-sm leading-4 text-primary-10 mb-0">
                {getTextFormattedDate(dateFinPrevisionnelle)}
              </p>
            </div>
          )}

          {(((!!dateDebut || !!dateFinPrevisionnelle) &&
            (!!statut || !!niveauPriorite || !!ameliorationContinue)) ||
            !!statut ||
            !!niveauPriorite) && <Divider className="-mb-5" />}

          {/* Statut et niveau de priorité */}
          {(!!statut || !!niveauPriorite) && (
            <div className="flex flex-wrap justify-center gap-4">
              {!!statut && <BadgeStatut statut={statut} />}
              {!!niveauPriorite && <BadgePriorite priorite={niveauPriorite} />}
            </div>
          )}

          {/* Action récurrente */}
          {!!ameliorationContinue && (
            <div className="flex flex-wrap gap-2 justify-center items-center">
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

          {/* Justification si l'action est en pause ou abandonnée */}
          {!!justificationCalendrier && (
            <>
              <Divider className="-mb-5" />
              <p className="text-sm text-primary-10 text-left leading-[22px] mb-0">
                {justificationCalendrier}
              </p>
            </>
          )}
        </div>
      ) : (
        <EmptyCard
          picto={className => <EmptyCalendarPicto className={className} />}
          title="Aucun planning n'est renseigné !"
          subTitle="Date de début | Date de fin prévisionnelle | Statut | Niveau de priorité"
          isReadonly={isReadonly}
          action={{
            label: 'Ajouter le planning prévisionnel',
            onClick: () => setIsModalOpen(true),
          }}
          className={className}
        />
      )}

      <ModalePlanning
        isOpen={isModalOpen}
        setIsOpen={setIsModalOpen}
        fiche={fiche}
        updateFiche={updateFiche}
      />
    </>
  );
};

export default FicheActionPlanning;
