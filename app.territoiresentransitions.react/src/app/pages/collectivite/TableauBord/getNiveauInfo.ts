import {LabellisationParNiveauRead} from 'app/pages/collectivite/TableauBord/useLabellisationParNiveau';
import {toFixed} from 'utils/toFixed';

export const NIVEAUX = [1, 2, 3, 4, 5];

const scoreRequisParNiveau: {[key: number]: number} = {
  1: 0,
  2: 35,
  3: 50,
  4: 65,
  5: 75,
};

const toPercentString = (n: number) => toFixed(n, 1).toString() + '%';

/**
 * Indique si un niveau a été obtenu ou non, et fourni un message
 * explicatif.
 */
export const getNiveauInfo = (
  /** score réalisé courant (via le remplissage des référentiels) */
  realisePercentage: number,
  /** données de labellisation attribuées pour le référentiel/collectivité par niveau */
  labellisationParNiveau: LabellisationParNiveauRead,
  /** numéro du niveau (à partir de 1) */
  niveau: number
): {obtenu: boolean; message: string} => {
  const labellisation = labellisationParNiveau[niveau];

  /** ce niveau a été obtenu **/
  if (labellisation) {
    const obtenu = true;

    const {obtenue_le, score_realise, score_programme} = labellisation;
    const year = new Date(obtenue_le).getFullYear();

    // pas de score affiché pour la 1ère étoile (ou si il n'y a pas de score)
    if (niveau === 1 || !score_realise) {
      return {obtenu, message: `Reconnaissance obtenue en ${year}`};
    }

    // étoile 2+ obtenue
    return {
      obtenu,
      message: `Score labellisé en ${year} : ${toPercentString(
        score_realise
      )}\nAmbition à quatre ans : ${toPercentString(score_programme)}`,
    };
  }

  /** pas de données pour ce niveau mais pour les suivants oui **/
  if (Object.keys(labellisationParNiveau).find(v => parseInt(v) > niveau)) {
    return {obtenu: true, message: 'Reconnaissance obtenue'};
  }

  /** ce niveau n'a pas encore été obtenu **/
  const obtenu = false;
  // pourcentage restant
  const restant = scoreRequisParNiveau[niveau] - realisePercentage;

  // le niveau précédent a été obtenu
  if (labellisationParNiveau[niveau - 1] && !isNaN(restant)) {
    // le score requis pour obtenir le niveau a été dépassé
    if (restant < 0) {
      return {
        obtenu,
        message:
          'Vous atteignez le score requis, félicitations ! Candidatez dès à présent ou continuez à progresser jusqu’à la fin de votre cycle de labellisation.',
      };
    }

    // le score requis pour obtenir le niveau
    return {
      obtenu,
      message: `Plus que ${toPercentString(
        restant
      )} à réaliser pour candidater, d'après votre score actuel !`,
    };
  }

  // le niveau précédent n'a pas été obtenu
  return {
    obtenu,
    message: `Score requis : ${toPercentString(scoreRequisParNiveau[niveau])}`,
  };
};
