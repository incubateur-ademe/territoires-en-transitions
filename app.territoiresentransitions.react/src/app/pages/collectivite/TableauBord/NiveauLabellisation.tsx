/**
 * Affiche le niveau de labellisation d'une collectivité
 *
 * Spec: https://github.com/betagouv/territoires-en-transitions/issues/453#issuecomment-1035227214
 * https://mattermost.incubateur.net/betagouv/pl/hcajyhsqfing3b5cuf854ue4dc
 */

import {LabellisationReadByEtoiles} from './useLabellisation';
import {toPercentString} from 'utils/score';
import {BlueStar, GreyStar} from './Star';

const MAX_STARS = 5;
const STEPS = [0.35, 0.5, 0.65, 0.75];

export type TNiveauLabellisationProps = {
  labellisation: LabellisationReadByEtoiles;
};

export const NiveauLabellisation = (props: TNiveauLabellisationProps) => {
  const {labellisation} = props;
  const hasEtoiles =
    Object.values(labellisation).length - (labellisation[0] ? 1 : 0) > 0;

  if (!hasEtoiles) {
    // Cas particulier aucune étoile bleue : pas de comportement au survol de la souris, sur aucune étoile
    return <NonLabellise />;
    //return <NonLabellise {...props} />;
  }

  return <NiveauActuel {...props} />;
};

const NonLabellise = (/* props: TNiveauLabellisationProps */) => {
  //const {labellisation} = props;
  // const {score_realise} = labellisation;

  return (
    <div className="flex flex-col items-center">
      <h2>Non labellisé</h2>
      <div className="flex space-x-4 pb-12">
        {Array(MAX_STARS)
          .fill(0)
          .map((v, i) => (
            <GreyStar key={`s${i}`} />
          ))}
      </div>
      {/*
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
        */}
    </div>
  );
};

const NiveauActuel = (props: TNiveauLabellisationProps) => {
  const {labellisation} = props;

  return (
    <div className="flex flex-col items-center">
      <h2>Niveau de labellisation actuel</h2>
      <div className="flex space-x-4 pb-12">
        {Array(MAX_STARS)
          .fill(0)
          .map((v, i) => {
            const current = labellisation[i + 1];
            // les données pour cette étoile existent
            if (current) {
              const {obtenue_le, score_realise, score_programme} = current;
              const year = new Date(obtenue_le).getFullYear();

              // pas de score affiché dans le tooltip de la 1ère étoile (ou si il n'y a pas de score)
              if (i === 0 || !score_realise) {
                return (
                  <BlueStar
                    key={`s${i}`}
                    title={`Reconnaissance obtenue en ${year}`}
                  />
                );
              }

              // étoile 2+ obtenue
              const tooltip = `Score labellisé en ${year} : ${toPercentString(
                score_realise
              )}\nAmbition à quatre ans : ${toPercentString(score_programme)}`;
              return <BlueStar key={`s${i}`} title={tooltip} />;
            }

            // bien que la spec dise "Cas particulier deuxième étoile...", la règle doit
            // s'appliquer aux autres étoiles quand le score requis est dépassé (sinon le
            // tooltip "Plus que ...% à réaliser..." va afficher une valeur négative !)
            if (labellisation[i]?.score_realise > STEPS[i - 1]) {
              return (
                <GreyStar
                  key={`s${i}`}
                  title={
                    'Vous atteignez le score requis, félicitations ! Candidatez dès à présent ou continuez à progresser jusqu’à la fin de votre cycle de labellisation.'
                  }
                />
              );
            }

            if (i > 0) {
              // Étoile grisée suivante une étoile bleue : "Plus que [score requis- score courant actuel]% à réaliser pour candidater, d'après votre score actuel !"
              if (labellisation[i]) {
                const restant = STEPS[i - 1] - labellisation[i].score_realise;
                const tooltip = `Plus que ${toPercentString(
                  restant
                )} à réaliser pour candidater, d'après votre score actuel !`;
                return <GreyStar key={`s${i}`} title={tooltip} />;
              }

              // Étoiles grisées qui ne sont pas directement à la suite d'une étoile bleue : "Score requis : [score requis]%"
              return (
                <GreyStar
                  key={`s${i}`}
                  title={`Score requis : ${toPercentString(STEPS[i - 1])}`}
                />
              );
            }

            // pas de données pour cette étoile mais pour les étoiles suivantes oui
            if (Object.keys(labellisation).find(v => parseInt(v) > i + 1)) {
              return <BlueStar key={`s${i}`} title="Reconnaissance obtenue" />;
            }

            // prochaine étoile
            return (
              <GreyStar
                key={`s${i}`}
                title={`Score requis : ${toPercentString(STEPS[i - 1])}`}
              />
            );
          })}
      </div>
    </div>
  );
};
