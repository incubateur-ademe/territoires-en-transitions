import {LabellisationParcoursRead} from 'generated/dataLayer/labellisation_parcours_read';
import {LabellisationDemandeRead} from 'generated/dataLayer/labellisation_demande_read';
import {LabellisationPreuveFichierRead} from 'generated/dataLayer/labellisation_preuve_fichier_read';
import {CritereScore} from './CritereScore';
import {CriteresAction} from './CriteresAction';
import {CriterePreuves} from './CriterePreuves';
import {numLabels} from './numLabels';
import {CritereCompletude} from './CritereCompletude';

export type TCriteresLabellisationProps = {
  collectiviteId: number;
  parcours: LabellisationParcoursRead;
  demande: LabellisationDemandeRead | null;
  preuves: LabellisationPreuveFichierRead[];
};

/**
 * Affiche la liste des critères à remplir pour un niveau de labellisation
 */
export const CriteresLabellisation = (props: TCriteresLabellisationProps) => {
  const {parcours} = props;
  const {etoiles, critere_score} = parcours;
  const {atteint, score_a_realiser} = critere_score;

  return (
    <>
      <p className="text-grey625">
        Le premier niveau de labellisation ne nécessite pas d’audit et sera
        validé rapidement et directement par l’ADEME ! Les étoiles supérieures
        sont conditionnées à un audit réalisé par une personne experte mandatée
        par l’ADEME.
      </p>
      {etoiles !== '1' && atteint ? (
        <div className="fr-alert fr-alert--info fr-mb-2w">
          Bravo, vous avez plus de {Math.round(score_a_realiser * 100)} %
          d’actions réalisées ! Les critères ont été mis à jour pour préparer
          votre candidature à la {numLabels[etoiles]} étoile.
        </div>
      ) : null}
      <h2>Critères de labellisation</h2>
      <ul>
        <CritereCompletude {...props} />
        {etoiles !== '1' ? <CritereScore {...props} /> : null}
        <CriteresAction {...props} />
        <CriterePreuves {...props} />
      </ul>
    </>
  );
};
