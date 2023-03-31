import ActionCard from '../components/ActionCard';
import {FicheAction} from './data/types';
import FicheActionBadgeStatut from './FicheActionForm/FicheActionBadgeStatut';

type Props = {
  link: string;
  ficheAction: FicheAction;
};

const FicheActionCard = ({ficheAction, link}: Props) => {
  const generateDetails = (ficheAction: FicheAction) => {
    let details = '';
    if (!ficheAction.axes) {
      details = details + 'Fiche non classée';
      // on affiche la barre uniquement si "Fiche non classée" est présent
      if (ficheAction.pilotes) {
        details = details + ' | ';
      }
    }
    if (ficheAction.pilotes) {
      details =
        details + `Pilote${ficheAction.pilotes.length > 1 ? 's' : ''}: `;

      ficheAction.pilotes.forEach(
        (pilote: any, index: number, array: unknown[]) =>
          (details =
            details + `${pilote.nom}${index < array.length - 1 ? ', ' : ''}`)
      );
    }
    return details;
  };

  return (
    <ActionCard
      link={link}
      statutBadge={
        ficheAction.statut && (
          <FicheActionBadgeStatut statut={ficheAction.statut} small />
        )
      }
      details={generateDetails(ficheAction)}
      title={
        ficheAction.titre && ficheAction.titre.length > 0
          ? ficheAction.titre
          : 'Sans titre'
      }
    />
  );
};

export default FicheActionCard;
