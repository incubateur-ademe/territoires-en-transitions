/**
 * Affiche le niveau de labellisation d'une collectivité
 */
import {LabellisationRead} from 'generated/dataLayer/labellisation_read';
import {GreyStar} from './Star';

const MAX_STARS = 5;
const PALIER1 = 0.35;

export type TNiveauLabellisationProps = {
  labellisation: LabellisationRead;
};

export const NiveauLabellisation = (props: TNiveauLabellisationProps) => {
  const {labellisation} = props;
  const {obtenue_le} = labellisation;

  if (!obtenue_le) {
    return <NonLabellise {...props} />;
  }

  return <p>render something here...</p>;
};

const NonLabellise = (props: TNiveauLabellisationProps) => {
  const {labellisation} = props;
  const {score_realise} = labellisation;

  return (
    <div className="flex flex-col items-center">
      <h2>Non labellisé</h2>
      <div className="flex space-x-4 pb-12">
        {Array(MAX_STARS)
          .fill(0)
          .map(() => (
            <GreyStar />
          ))}
      </div>
      <h2>Objectif : première étoile</h2>
      <div className="max-w-sm">
        <p className="font-bold mb-3">Pré-requis pour la demande d’audit</p>
        <ul className="fr-text--sm">
          <li>Sélectionner un statut pour chacune des sous-actions</li>
          <li>Atteindre un score minimal pour plusieurs sous-actions</li>
          <li>Fournir les documents officiels pour votre candidature</li>
        </ul>
        {score_realise > PALIER1 ? (
          <div className="fr-alert fr-alert--info fr-alert--sm">
            <p>
              Bravo, vous avez plus de 35% d’actions réalisées ! Pour candidater
              directement à la deuxième étoile, ajoutez les preuves pour ces
              actions.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
};
