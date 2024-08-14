import {NavLink} from 'react-router-dom';
import classNames from 'classnames';
import {
  format,
  differenceInCalendarDays,
  isBefore,
  startOfToday,
} from 'date-fns';

import {Icon, Notification, Tooltip} from '@tet/ui';

import {FicheResume} from '../data/types';
import {generateTitle} from '../data/utils';
import BadgeStatut from '../../components/BadgeStatut';
import BadgePriorite from '../../components/BadgePriorite';
import FicheActionSupprimerModal from '../FicheActionSupprimerModal';
import {useDeleteFicheAction} from '../data/useDeleteFicheAction';
import {useCurrentCollectivite} from 'core-logic/hooks/useCurrentCollectivite';
import ModifierFicheModale from './ModifierFicheModale';
import {useState} from 'react';
import {QueryKey} from 'react-query';

type Props = {
  link?: string;
  ficheAction: FicheResume;
  openInNewTab?: boolean;
  /** Pour invalider la liste des fiches d'un axe à la suppression de la fiche */
  axeId?: number;
  /** Pour invalider le plan à la suppression de la fiche */
  planId?: number;
  /** Permet d'afficher le menu d'option de la carte */
  isEditable?: boolean;
  editKeysToInvalidate?: QueryKey[];
};

const FicheActionCard = ({
  openInNewTab,
  ficheAction,
  axeId,
  link,
  isEditable = false,
  editKeysToInvalidate,
}: Props) => {
  const collectivite = useCurrentCollectivite();

  const isNotClickable =
    collectivite?.niveau_acces === null && ficheAction.restreint;

  const [isEditOpen, setIsEditOpen] = useState(false);

  const {mutate: deleteFiche} = useDeleteFicheAction({
    ficheId: ficheAction.id!,
    axeId: axeId || null,
    keysToInvalidate: editKeysToInvalidate,
  });

  const carteId = `fiche-${ficheAction.id}`;

  const getModifiedSince = (date: string) => {
    const modifiedDate = new Date(date);
    const diff = differenceInCalendarDays(new Date(), modifiedDate);

    if (diff === 0) {
      return "aujourd'hui";
    }
    if (diff < 7) {
      return `il y a ${diff} jours`;
    }
    if (diff < 14) {
      return 'il y a une semaine';
    }
    if (diff < 21) {
      return 'il y a 2 semaines';
    }
    if (diff < 28) {
      return 'il y a 3 semaines';
    }
    return `le ${format(modifiedDate, 'dd/MM/yyyy')}`;
  };

  return (
    <div
      data-test="ActionCarte"
      id={carteId}
      className={classNames(
        'relative group h-full rounded-xl border border-grey-3 bg-white',
        {'hover:border-primary-3 hover:bg-primary-1': !isNotClickable}
      )}
    >
      {/** Cadenas accès restreint */}
      {ficheAction.restreint && (
        <div
          data-test="FicheCartePrivee"
          title="Fiche en accès restreint"
          className="absolute -top-4 left-5"
        >
          <Notification icon="lock-fill" size="xs" classname="w-7 h-7" />
        </div>
      )}
      {/** Menu d'options */}
      {!collectivite?.readonly && isEditable && (
        <div className="group absolute top-4 right-4 !flex gap-2">
          <>
            {isEditOpen && (
              <ModifierFicheModale
                initialFiche={ficheAction}
                axeId={axeId}
                isOpen={isEditOpen}
                setIsOpen={() => setIsEditOpen(!isEditOpen)}
                keysToInvalidate={editKeysToInvalidate}
              />
            )}
            <button
              data-test="EditerFicheBouton"
              id={`fiche-${ficheAction.id}-edit-button`}
              title="Modifier"
              onClick={() => setIsEditOpen(!isEditOpen)}
              className={classNames(
                'invisible group-hover:visible fr-btn fr-btn--tertiary fr-btn--sm fr-icon-edit-line !bg-white hover:!bg-primary-3 rounded-lg'
              )}
            />
          </>
          <FicheActionSupprimerModal
            buttonClassname="invisible group-hover:visible !bg-white rounded-lg"
            isInMultipleAxes={
              (ficheAction.plans && ficheAction.plans.length > 1) || false
            }
            onDelete={() => deleteFiche()}
          />
        </div>
      )}
      {/** Carte */}
      <NavLink
        to={link || ''}
        target={openInNewTab ? '_blank' : undefined}
        rel={openInNewTab ? 'noopener noreferrer' : undefined}
        className={classNames(
          'block bg-none h-full',
          {'after:!hidden': openInNewTab},
          {'cursor-default': !ficheAction.id},
          {
            '!cursor-default, pointer-events-none': isNotClickable,
          }
        )}
        onClick={e => isNotClickable && e.preventDefault()}
      >
        <div className="flex flex-col gap-3 h-full p-4">
          {(ficheAction.niveau_priorite || ficheAction.statut) && (
            <div className="flex items-center gap-4">
              {ficheAction.statut && (
                <BadgeStatut size="sm" statut={ficheAction.statut} />
              )}
              {ficheAction.niveau_priorite && (
                <BadgePriorite
                  size="sm"
                  priorite={ficheAction.niveau_priorite}
                />
              )}
            </div>
          )}
          <span className={classNames('font-medium text-primary-10')}>
            {generateTitle(ficheAction.titre)}
          </span>
          <div className="text-sm text-grey-8" title="Emplacements">
            {!!ficheAction.plans && ficheAction.plans.length > 0
              ? ficheAction.plans
                  ?.map(plan => generateTitle(plan?.nom))
                  .join(' | ')
              : 'Fiche non classée'}
          </div>
          <span className="text-xs text-grey-8 italic">
            Modifié {getModifiedSince(ficheAction.modified_at!)}
          </span>
          {(ficheAction.pilotes?.length || ficheAction.date_fin_provisoire) && (
            <div className="flex items-center gap-4 flex-wrap text-sm text-grey-8">
              {ficheAction.pilotes && ficheAction.pilotes.length > 0 && (
                <div className="flex items-start" title="Pilotes">
                  <Icon icon="user-line" size="sm" className="mr-1.5" />
                  {ficheAction.pilotes[0].nom}
                  {ficheAction.pilotes.length > 1 && (
                    <Tooltip
                      label={
                        <div className="flex flex-col gap-1">
                          {ficheAction.pilotes.map((pilote, i) => (
                            <span key={i}>{pilote.nom}</span>
                          ))}
                        </div>
                      }
                      openingDelay={250}
                    >
                      <span className="ml-1.5 font-medium text-primary-8">
                        +{ficheAction.pilotes.length - 1}
                      </span>
                    </Tooltip>
                  )}
                </div>
              )}
              {ficheAction.date_fin_provisoire && (
                <>
                  {ficheAction.pilotes && ficheAction.pilotes.length > 0 && (
                    <div className="w-[1px] h-6 bg-grey-3" />
                  )}
                  <div
                    className={classNames(
                      'flex items-center whitespace-nowrap',
                      {
                        'text-error-1': isBefore(
                          new Date(ficheAction.date_fin_provisoire),
                          startOfToday()
                        ),
                      }
                    )}
                    title="Échéance"
                  >
                    <span className="fr-icon-calendar-line mr-1.5 before:!w-4" />
                    {format(
                      new Date(ficheAction.date_fin_provisoire),
                      'dd/MM/yyyy'
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </NavLink>
    </div>
  );
};

export default FicheActionCard;
