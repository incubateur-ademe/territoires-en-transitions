import { ActionDefinitionSummary } from '@/app/referentiels/ActionDefinitionSummaryReadEndpoint';
import { ActionCommentaire } from '@/app/referentiels/actions/action-commentaire';
import { useActionStatut } from '@/app/referentiels/actions/action-statut/use-action-statut';
import classNames from 'classnames';
import { useEffect, useRef } from 'react';
import SubActionHeader from './sub-action.header';

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
  onClick,
}: SubActionCardProps): JSX.Element => {
  const ref = useRef<HTMLDivElement>(null);

  const hash = getHashFromUrl();

  const { statut, filled } = useActionStatut(subAction.id);
  const { avancement, concerne } = statut || {};

  const shouldDisplayProgressBar =
    concerne !== false &&
    (avancement === 'detaille' ||
      (avancement === 'non_renseigne' && filled === true) ||
      (statut === null && filled === true));

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
        'bg-grey-1 hover:bg-grey-2 transition-colors border border-grey-3 rounded-lg p-4 cursor-pointer',
        { 'bg-primary-1 hover:bg-primary-1 border-primary-3': isOpen }
      )}
      onClick={onClick}
    >
      {/* En-tête */}
      <SubActionHeader
        actionDefinition={subAction}
        displayProgressBar={shouldDisplayProgressBar}
      />

      {/* Commentaire associé à la sous-action */}
      <ActionCommentaire action={subAction} className="mt-4" />
    </div>
  );
};

export default SubActionCard;
