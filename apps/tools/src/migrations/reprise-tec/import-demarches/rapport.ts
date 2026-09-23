/** Le rapport : ce que l'import a lu, écarté et écrit. Uniquement pour le debug.*/

import { Dossier } from './dossier';
import { Motif } from './perimetre';

/** Affiche les comptes, les dates revues et les collectivités à deux dossiers en cours. */
export const printRapport = ({
  lues,
  ecartees,
  elaborationsRemplacees,
  ecrits,
  deuxDossiersEnCours,
  isConfirmed,
}: {
  lues: number;
  ecartees: { motif: Motif }[];
  elaborationsRemplacees: number[];
  ecrits: Dossier[];
  deuxDossiersEnCours: string[];
  isConfirmed: boolean;
}) => {
  const compter = (valeurs: string[]) =>
    [...new Set(valeurs)]
      .sort()
      .map((v) => `${v} : ${valeurs.filter((x) => x === v).length}`);

  console.log(`${lues} lignes de dossier lues dans T&C`);
  for (const ligne of compter(ecartees.map((e) => e.motif))) {
    console.log(`  écartées, ${ligne}`);
  }
  console.log(
    `  écartées, élaboration remplacée par une plus récente : ${elaborationsRemplacees.length}`
  );
  console.log(`${ecrits.length} dossiers écrits`);
  for (const ligne of compter(ecrits.map((d) => d.colonnes.status))) {
    console.log(`  ${ligne}`);
  }
  const avecDatesRevues = ecrits.filter((d) => d.datesRevues.length > 0);
  if (avecDatesRevues.length > 0) {
    console.log(
      `\nDossiers écrits avec une date saisie avant l'an 2000 : ${avecDatesRevues.length}`
    );
    for (const d of avecDatesRevues) {
      console.log(`  dossier ${d.tecId} : ${d.datesRevues.join(', ')}`);
    }
  }
  if (deuxDossiersEnCours.length > 0) {
    console.log(
      `\nCollectivités qui auront deux dossiers en cours (D4, sans blocage, voir le README) : ${deuxDossiersEnCours.length}`
    );
    for (const ligne of deuxDossiersEnCours) {
      console.log(ligne);
    }
  }
  console.log(
    isConfirmed
      ? '\nImport terminé.'
      : '\nSimulation : tout a été annulé. Relancer avec --confirm pour importer.'
  );
};
