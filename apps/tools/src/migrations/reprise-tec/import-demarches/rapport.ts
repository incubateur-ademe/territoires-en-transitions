/** Le rapport : ce que l'import a lu, écarté et écrit. Uniquement pour le debug. */

import { decrireDossier, type Dossier } from './dossier';
import type { Ecart } from './ecarts';

/** Affiche les comptes (écarts, statuts, sources de l'obligation et de l'adoption), les dates revues, les transmissions que le suivi contredit et les collectivités à deux dossiers en cours. */
export const printRapport = ({
  lues,
  ecarts,
  ecrits,
  elaborationsAdoptees,
  deuxDossiersEnCours,
  isConfirmed,
}: {
  lues: number;
  ecarts: Ecart[];
  ecrits: Dossier[];
  elaborationsAdoptees: Dossier[];
  deuxDossiersEnCours: string[];
  isConfirmed: boolean;
}) => {
  const compter = (valeurs: string[]) =>
    [...new Set(valeurs)]
      .sort()
      .map((v) => `${v} : ${valeurs.filter((x) => x === v).length}`);

  console.log(`${lues} lignes de dossier lues dans T&C`);
  for (const ligne of compter(ecarts.map((e) => e.motif))) {
    console.log(`  écartées, ${ligne}`);
  }
  console.log(`${ecrits.length} dossiers écrits`);
  for (const ligne of compter(ecrits.map((d) => d.colonnes.status))) {
    console.log(`  ${ligne}`);
  }
  console.log('Obligation décidée par (A31 / Q23)');
  for (const ligne of compter(ecrits.map((d) => d.sources.obligation))) {
    console.log(`  ${ligne}`);
  }
  console.log("Date d'adoption des publiés prise dans (D7)");
  for (const ligne of compter(
    ecrits.flatMap((d) => (d.sources.adoption ? [d.sources.adoption] : []))
  )) {
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
  const avecTransmissionRevue = ecrits.filter(
    (d) => d.transmissionRevue !== null
  );
  if (avecTransmissionRevue.length > 0) {
    console.log(
      `\nDossiers dont l'avis de l'État du suivi précède la transmission : ${avecTransmissionRevue.length}`
    );
    for (const d of avecTransmissionRevue) {
      console.log(`  ${decrireDossier(d)} : ${d.transmissionRevue}`);
    }
  }
  if (elaborationsAdoptees.length > 0) {
    console.log(
      `\nÉlaborations dans T&C, approuvées au suivi après leur lancement, écrites publiées : ${elaborationsAdoptees.length}`
    );
    for (const d of elaborationsAdoptees) {
      console.log(
        `  ${decrireDossier(d)} : lancé le ${d.colonnes.launchedAt?.slice(
          0,
          10
        )}, approuvé le ${d.colonnes.adoptedAt}`
      );
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
