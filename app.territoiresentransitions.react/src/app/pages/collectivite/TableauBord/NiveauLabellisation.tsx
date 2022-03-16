/**
 * Affiche le niveau de labellisation d'une collectivité
 *
 * Spec: https://github.com/betagouv/territoires-en-transitions/issues/453#issuecomment-1035227214
 * https://mattermost.incubateur.net/betagouv/pl/hcajyhsqfing3b5cuf854ue4dc
 */

import {LabellisationParNiveauRead} from './useLabellisationParNiveau';
import {getNiveauInfo, NIVEAUX} from './getNiveauInfo';
import {BlueStar, GreyStar} from './Star';

export type TNiveauLabellisationProps = {
  /** score réalisé courant (via le remplissage des référentiels) */
  realisePercentage: number;
  /** données de labellisation attribuées pour le référentiel/collectivité par niveau */
  labellisationParNiveau: LabellisationParNiveauRead;
};

export const NiveauLabellisation = (props: TNiveauLabellisationProps) => {
  const {labellisationParNiveau} = props;
  const auMoinsUneEtoile =
    Object.values(labellisationParNiveau).length -
      (labellisationParNiveau[0] ? 1 : 0) >
    0;

  if (!auMoinsUneEtoile) {
    // Cas particulier aucune étoile bleue : pas de comportement au survol de la souris, sur aucune étoile
    return <NonLabellise />;
  }

  return <NiveauActuel {...props} />;
};

const NonLabellise = () => {
  return (
    <div className="flex flex-col items-center mt-4">
      <div className="font-semibold text-center mb-4 text-xl">
        Non labellisé
      </div>
      <div className="flex space-x-4 pb-12">
        {NIVEAUX.map(niveau => (
          <GreyStar key={`n${niveau}`} />
        ))}
      </div>
    </div>
  );
};

const NiveauActuel = (props: TNiveauLabellisationProps) => {
  const {realisePercentage, labellisationParNiveau} = props;

  return (
    <div className="flex flex-col items-center mt-4">
      <div className="font-semibold text-center mb-4 text-xl">
        Niveau de labellisation actuel
      </div>
      <div className="flex space-x-4 pb-12">
        {NIVEAUX.map(niveau => {
          const {obtenu, message} = getNiveauInfo(
            realisePercentage,
            labellisationParNiveau,
            niveau
          );
          const Star = obtenu ? BlueStar : GreyStar;
          return <Star key={`n${niveau}`} title={message} />;
        })}
      </div>
    </div>
  );
};
