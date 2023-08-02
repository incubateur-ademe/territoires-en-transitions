import ActionCard from '../components/ActionCard';
import {FicheResume} from './data/types';
import {formatNomPilotes, generateTitle} from './data/utils';
import FicheActionBadgeStatut from './FicheActionForm/FicheActionBadgeStatut';

const generateDetails = (fiche: FicheResume, displayAxe: boolean) => {
  const {plans, pilotes} = fiche;
  let details = '';

  const plan = plans?.[0];

  if (displayAxe) {
    details = plan?.nom || 'Fiches non classées';
  }
  if (displayAxe && pilotes) {
    details += ' | ';
  }
  if (pilotes) {
    details += `${formatNomPilotes(pilotes)}`;
  }
  return details;
};

type Props = {
  link: string;
  ficheAction: FicheResume;
  displayAxe?: boolean;
  openInNewTab?: boolean;
};

const FicheActionCard = ({
  openInNewTab,
  ficheAction,
  displayAxe = false,
  link,
}: Props) => {
  return (
    <ActionCard
      openInNewTab={openInNewTab}
      link={link}
      statutBadge={
        ficheAction.statut && (
          <FicheActionBadgeStatut statut={ficheAction.statut} small />
        )
      }
      details={generateDetails(ficheAction, displayAxe)}
      title={generateTitle(ficheAction.titre)}
    />
  );
};

export default FicheActionCard;
