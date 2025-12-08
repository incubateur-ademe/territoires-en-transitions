import {
  getTextFormattedDate,
  getTruncatedText,
} from '@/app/utils/formatUtils';
import { isFicheOnTime } from '@tet/domain/plans';
import { Button, Divider, EmptyCard, Icon } from '@tet/ui';
import classNames from 'classnames';
import { useState } from 'react';
import { useFicheContext } from '../../context/fiche-context';
import ModalePlanning from './ModalePlanning';
import EmptyCalendarPicto from './PictosPlanning/EmptyCalendarPicto';
import FilledCalendarPicto from './PictosPlanning/FilledCalendarPicto';

type FicheActionPlanningProps = {
  className?: string;
};

export const FicheActionPlanning = ({
  className,
}: FicheActionPlanningProps) => {
  const { fiche, isReadonly } = useFicheContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFullJustification, setIsFullJustification] = useState(false);

  const {
    ameliorationContinue,
    calendrier: justificationCalendrier,
    dateDebut,
    dateFin: dateFinPrevisionnelle,
    priorite: niveauPriorite,
    statut,
    tempsDeMiseEnOeuvre,
  } = fiche;

  const isEmpty =
    !ameliorationContinue &&
    !dateDebut &&
    !dateFinPrevisionnelle &&
    !tempsDeMiseEnOeuvre &&
    !justificationCalendrier;

  const emptyTags = [
    'Date de début',
    'Date de fin prévisionnelle',
    'Temps de mise en œuvre',
  ];
  if (!statut) emptyTags.push('Statut');
  if (!niveauPriorite) emptyTags.push('Niveau de priorité');

  const {
    truncatedText: truncatedJustification,
    isTextTruncated: isJustificationTruncated,
  } = getTruncatedText(justificationCalendrier ?? '', 300);

  return (
    <>
      {!isEmpty ? (
        <div
          data-test="planning"
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
              className="!absolute top-4 right-3"
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
              {dateDebut
                ? getTextFormattedDate({ date: dateDebut })
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
                  'text-error-1': !isFicheOnTime(fiche),
                  'text-primary-10': isFicheOnTime(fiche),
                })}
              >
                {dateFinPrevisionnelle
                  ? getTextFormattedDate({ date: dateFinPrevisionnelle })
                  : 'Non renseignée'}
              </p>
            </div>
          )}

          {/* Temps de mise en oeuvre */}
          <div>
            <h6 className="text-sm leading-4 text-primary-9 uppercase mb-2">
              Temps de mise en œuvre
            </h6>
            <p
              className={classNames('text-sm leading-4 mb-0', {
                'text-grey-7':
                  !tempsDeMiseEnOeuvre || tempsDeMiseEnOeuvre.nom === null,
                'text-primary-10':
                  !!tempsDeMiseEnOeuvre && tempsDeMiseEnOeuvre.nom !== null,
              })}
            >
              {!!tempsDeMiseEnOeuvre && tempsDeMiseEnOeuvre.nom !== null
                ? tempsDeMiseEnOeuvre.nom
                : 'Non renseigné'}
            </p>
          </div>

          {(!!statut || !!niveauPriorite || !!ameliorationContinue) && (
            <Divider className="-mb-5" />
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
                {"l'action se répète tous les ans"}
              </span>
            </div>
          )}

          {/* Justification si l'action est en pause ou abandonnée */}
          {!!justificationCalendrier && (
            <>
              <Divider className="-mb-5" />
              <p className="text-sm text-primary-10 text-left leading-[22px] whitespace-pre-wrap mb-0">
                {isFullJustification || !isJustificationTruncated
                  ? justificationCalendrier
                  : truncatedJustification}
              </p>
              {isJustificationTruncated && (
                <Button
                  variant="underlined"
                  size="xs"
                  className="ml-auto"
                  onClick={() =>
                    setIsFullJustification((prevState) => !prevState)
                  }
                >
                  {isFullJustification ? 'Voir moins' : 'Voir plus'}
                </Button>
              )}
            </>
          )}
        </div>
      ) : (
        <EmptyCard
          dataTest="empty-planning"
          picto={(props) => <EmptyCalendarPicto {...props} />}
          title="Aucun planning n'est renseigné !"
          tags={emptyTags}
          isReadonly={isReadonly}
          actions={[
            {
              dataTest: 'modalites',
              children: 'Ajouter le planning prévisionnel',
              onClick: () => setIsModalOpen(true),
            },
          ]}
          className={className}
          size="xs"
        />
      )}

      <ModalePlanning
        isOpen={isModalOpen && !isReadonly}
        setIsOpen={setIsModalOpen}
        fiche={fiche}
      />
    </>
  );
};
