/**
 * Affiche le niveau de labellisation d'une collectivité
 */

import {LabellisationRead} from 'generated/dataLayer/labellisation_read';
import {toPercentString} from 'utils/score';
import {BlueStar, GreyStar} from './Star';

const MAX_STARS = 5;
const STEPS = [0.35, 0.5, 0.65, 0.75];

export type TNiveauLabellisationProps = {
  labellisation: LabellisationRead;
};

export const NiveauLabellisation = (props: TNiveauLabellisationProps) => {
  const {labellisation} = props;
  const {etoiles} = labellisation;

  if (!etoiles) {
    return <NonLabellise {...props} />;
  }

  return <NiveauActuel {...props} />;
};

const NonLabellise = (props: TNiveauLabellisationProps) => {
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
  const {etoiles, obtenue_le, score_realise, score_programme} = labellisation;

  return (
    <div className="flex flex-col items-center">
      <h2>Niveau de labellisation actuel</h2>
      <div className="flex space-x-4 pb-12">
        {Array(MAX_STARS)
          .fill(0)
          .map((v, i) => {
            // étoile déjà obtenue
            if (i < etoiles) {
              return (
                <BlueStar
                  key={`s${i}`}
                  title={`Score labellisé en ${obtenue_le?.getFullYear()} : ${toPercentString(
                    score_realise
                  )}\nAmbition à quatre ans : ${toPercentString(
                    score_programme
                  )}`}
                />
              );
            }
            // étoile suivante
            if (i === etoiles) {
              // Cas particulier deuxième étoile si le score courant est supérieur à 35%
              if (i === 1 && score_realise > STEPS[0]) {
                return (
                  <GreyStar
                    key={`s${i}`}
                    title="Vous atteignez le score requis, félicitations ! Candidatez dès à présent ou continuez à progresser jusqu’à la fin de votre cycle de labellisation."
                  />
                );
              }
              return (
                <GreyStar
                  key={`s${i}`}
                  title={`Plus que ${toPercentString(
                    STEPS[i - 1] - score_realise
                  )} à réaliser pour candidater, d'après votre score actuel !`}
                />
              );
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
