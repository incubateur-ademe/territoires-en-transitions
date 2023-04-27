import ActionCard from '../components/ActionCard';
import {FicheAction, FicheResume} from './data/types';
import FicheActionBadgeStatut from './FicheActionForm/FicheActionBadgeStatut';

function isFicheResumeFromAxe(
  fiche: FicheAction | FicheResume
): fiche is FicheResume {
  return (fiche as FicheResume).plans !== undefined;
}

const generateDetails = (fiche: FicheAction | FicheResume) => {
  let details = '';
  if (isFicheResumeFromAxe(fiche)) {
    if (!fiche.plans) {
      details = details + 'Fiche non classée';
      // on affiche la barre uniquement si "Fiche non classée" est présent
      if (fiche.pilotes) {
        details = details + ' | ';
      }
    }
  } else {
    if (!fiche.axes) {
      details = details + 'Fiche non classée';
      // on affiche la barre uniquement si "Fiche non classée" est présent
      if (fiche.pilotes) {
        details = details + ' | ';
      }
    }
  }
  if (fiche.pilotes) {
    details = details + `Pilote${fiche.pilotes.length > 1 ? 's' : ''}: `;

    fiche.pilotes.forEach(
      (pilote: any, index: number, array: unknown[]) =>
        (details =
          details + `${pilote.nom}${index < array.length - 1 ? ', ' : ''}`)
    );
  }
  return details;
};

type Props = {
  link: string;
  ficheAction: FicheAction | FicheResume;
};

const FicheActionCard = ({ficheAction, link}: Props) => {
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
