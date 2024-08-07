import {useState} from 'react';
import classNames from 'classnames';
import {format, isBefore, startOfToday} from 'date-fns';
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
    created_at: dateCreation,
    date_debut: dateDebut,
    date_fin_provisoire: dateFinPrevisionnelle,
    niveau_priorite: niveauPriorite,
    statut,
  } = fiche;

  const isEmpty = !ameliorationContinue && !dateDebut && !dateFinPrevisionnelle;

  const isLate =
    dateFinPrevisionnelle &&
    isBefore(new Date(dateFinPrevisionnelle), startOfToday());

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

          <div>
            <h6 className="text-sm leading-4 text-primary-9 uppercase mb-2">
              Date de début
            </h6>
            <p
              className={classNames('text-sm leading-4 mb-0', {
                'text-grey-7': !dateDebut,
                'text-primary-10': !!dateDebut,
              })}
            >
              {!!dateDebut
                ? getTextFormattedDate({date: dateDebut})
                : 'Non renseignée'}
            </p>
          </div>

          {/* Date de fin prévisionnelle */}
          {!ameliorationContinue && (
            <div>
              <h6 className="text-sm leading-4 text-primary-9 uppercase mb-2">
                Date de fin prévisionnelle
              </h6>
              <p
                className={classNames('text-sm leading-4 mb-0', {
                  'text-grey-7': !dateFinPrevisionnelle,
                  'text-error-1': !!dateFinPrevisionnelle && isLate,
                  'text-primary-10': !!dateFinPrevisionnelle && !isLate,
                })}
              >
                {!!dateFinPrevisionnelle
                  ? getTextFormattedDate({date: dateFinPrevisionnelle})
                  : 'Non renseignée'}
              </p>
            </div>
          )}

          {(!!statut || !!niveauPriorite || !!ameliorationContinue) && (
            <Divider className="-mb-5" />
          )}

          {/* Statut et niveau de priorité */}
          {(!!statut || !!niveauPriorite) && (
            <div className="flex flex-wrap justify-center gap-4">
              {!!statut && <BadgeStatut statut={statut} />}
              {!!niveauPriorite && <BadgePriorite priorite={niveauPriorite} />}
            </div>
          )}

          {/* Action récurrente */}
          {!!ameliorationContinue && (
            <div className="flex flex-wrap gap-2 justify-center items-start">
              <Icon
                icon="loop-left-line"
                className="text-primary-10"
                size="sm"
              />
              <span className="text-sm text-primary-10 font-medium">
                l'action se répète tous les ans
              </span>
            </div>
          )}

          {/* Justification si l'action est en pause ou abandonnée */}
          {!!justificationCalendrier && (
            <>
              <Divider className="-mb-5" />
              <p className="text-sm text-primary-10 text-left leading-[22px] whitespace-pre-wrap mb-0">
                {justificationCalendrier}
              </p>
            </>
          )}

          {/* Date de création de la fiche */}

          {!!dateCreation && (
            <>
              <Divider className="-mb-5" />
              <p className="text-sm text-primary-10 text-left mb-0">
                Fiche action créée le{' '}
                <span className="font-medium">
                  {format(new Date(dateCreation), 'dd/MM/yyyy')}
                </span>
              </p>
            </>
          )}
        </div>
      ) : (
        <EmptyCard
          picto={className => (
            <>
              <EmptyCalendarPicto className={className} />
              {(!!statut || !!niveauPriorite) && (
                <div className="flex flex-wrap justify-center gap-4 mb-2">
                  {!!statut && <BadgeStatut statut={statut} />}
                  {!!niveauPriorite && (
                    <BadgePriorite priorite={niveauPriorite} />
                  )}
                </div>
              )}
            </>
          )}
          title="Aucun planning n'est renseigné !"
          subTitle={`Date de début | Date de fin prévisionnelle${
            !statut ? ' | Statut' : ''
          }${!niveauPriorite ? ' | Niveau de priorité' : ''}`}
          isReadonly={isReadonly}
          action={{
            label: 'Ajouter le planning prévisionnel',
            onClick: () => setIsModalOpen(true),
          }}
          className={className}
        />
      )}

      <ModalePlanning
        isOpen={isModalOpen && !isReadonly}
        setIsOpen={setIsModalOpen}
        fiche={fiche}
        updateFiche={updateFiche}
      />
    </>
  );
};

export default FicheActionPlanning;
