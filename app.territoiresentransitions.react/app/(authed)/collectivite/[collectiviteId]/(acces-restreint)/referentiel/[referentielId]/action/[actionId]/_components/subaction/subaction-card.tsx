import { useCurrentCollectivite } from '@/api/collectivites';
import { ActionDefinitionSummary } from '@/app/referentiels/ActionDefinitionSummaryReadEndpoint';
import { useActionStatut } from '@/app/referentiels/actions/action-statut/use-action-statut';
import { useActionPreuvesCount } from '@/app/referentiels/preuves/usePreuves';
import { Divider } from '@/ui';
import ActionJustificationField from 'app.territoiresentransitions.react/app/(authed)/collectivite/[collectiviteId]/(acces-restreint)/referentiel/[referentielId]/action/[actionId]/_components/action/action.justification-field';
import SubactionCardActions from 'app.territoiresentransitions.react/app/(authed)/collectivite/[collectiviteId]/(acces-restreint)/referentiel/[referentielId]/action/[actionId]/_components/subaction/subaction-card.actions';
import SubactionCardHeader from 'app.territoiresentransitions.react/app/(authed)/collectivite/[collectiviteId]/(acces-restreint)/referentiel/[referentielId]/action/[actionId]/_components/subaction/subaction-card.header';
import classNames from 'classnames';
import { useEffect, useRef, useState } from 'react';
import ScoreIndicatifLibelle from '../score-indicatif/score-indicatif.libelle';

export const getHashFromUrl = () => {
  // Only run on client side since window is not available on server
  if (typeof window !== 'undefined') {
    // Get everything after # symbol, removing the # itself
    const hash = window.location.hash.slice(1);
    return hash;
  }

  return '';
};

type SubActionCardProps = {
  subAction: ActionDefinitionSummary;
  isOpen: boolean;
  showJustifications: boolean;
  onClick: () => void;
};

/**
 * Carte permettant l'affichage d'une sous-action
 * dans l'onglet "Suivi de l'action" du menu
 * "Référentiel CAE / ECI" de la page "Etat des lieux"
 */

const SubActionCard = ({
  subAction,
  isOpen,
  showJustifications,
  onClick,
}: SubActionCardProps): JSX.Element => {
  const { isReadOnly } = useCurrentCollectivite();

  const ref = useRef<HTMLDivElement>(null);

  const [openDetailledModal, setOpenDetailledModal] = useState(false);

  const hash = getHashFromUrl();

  const { statut, filled } = useActionStatut(subAction.id);
  const { avancement } = statut || {};

  const preuvesCount = useActionPreuvesCount(subAction.id);

  const isDetailled =
    avancement === 'detaille' ||
    (avancement === 'non_renseigne' && filled === true) ||
    (statut === null && filled === true);

  useEffect(() => {
    const id = hash.slice(1); // enlève le "#" au début du hash

    if (id.includes(subAction.id)) {
      // Scroll jusqu'à la sous-action indiquée dans l'url
      if (id === subAction.id && ref && ref.current) {
        setTimeout(() => {
          ref.current?.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'nearest',
          });
        }, 0);
      }
    }
  }, [hash, ref]);

  return (
    <div
      ref={ref}
      data-test={`SousAction-${subAction.identifiant}`}
      className={classNames(
        'flex flex-col gap-2 bg-grey-1 hover:bg-grey-2 transition-colors border border-grey-3 rounded-lg p-4 cursor-pointer',
        { 'bg-primary-1 hover:bg-primary-1 border-primary-3': isOpen }
      )}
      onClick={onClick}
    >
      {/* En-tête */}
      <SubactionCardHeader
        subAction={subAction}
        openDetailledState={{
          isOpen: openDetailledModal,
          setIsOpen: setOpenDetailledModal,
        }}
      />

      {/* Commentaire associé à la sous-action */}
      {showJustifications && (
        <ActionJustificationField
          actionId={subAction.id}
          placeholder="Explications sur l'état d'avancement"
        />
      )}

      {/* Informations sur les scores indicatifs */}
      <ScoreIndicatifLibelle actionId={subAction.id} />

      <div className="mt-auto flex flex-col gap-2">
        {!isReadOnly && (isDetailled || subAction.haveScoreIndicatif) && (
          <Divider color="light" className="-mb-6 mt-auto" />
        )}

        {/* Actions */}
        <SubactionCardActions
          actionId={subAction.id}
          haveScoreIndicatif={subAction.haveScoreIndicatif}
          isDetailled={isDetailled}
          setOpenDetailledModal={setOpenDetailledModal}
        />

        {/* Infos complémentaires */}
        {preuvesCount > 0 && (
          <Divider color="light" className="-mb-6 mt-auto" />
        )}
        {preuvesCount > 0 && (
          <div className="text-xs text-grey-8">
            <span>
              {preuvesCount} document{preuvesCount > 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubActionCard;
