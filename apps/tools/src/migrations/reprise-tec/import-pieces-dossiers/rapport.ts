/** Le rapport : ce que l'import a lu, fondu, rangé, écrit et déposé. */

import type { Ecart } from '../import-fiches/ecarts';
import { isNomDAvis, type buildAvis } from './avis';
import type { Bibliotheque } from './bibliotheque';
import type { Fichier } from './fichiers';
import type { Piece } from './pieces';
import type { Rangement } from './rangement';

/** Affiche les comptes de l'import. */
export const printRapport = ({
  bilan,
  ecarts,
  fichiers,
  pieces,
  rangements,
  inclusions,
  avis,
  bibliotheque,
  envoi,
  isConfirmed,
}: {
  bilan: { table: string; lues: number; ecrites: number; ecartees: number }[];
  ecarts: readonly Ecart[];
  fichiers: readonly Fichier[];
  pieces: readonly Piece[];
  rangements: readonly Rangement[];
  inclusions: number;
  avis: ReturnType<typeof buildAvis>;
  bibliotheque: Pick<Bibliotheque, 'creees' | 'reutilisees'>;
  envoi: { fichiers: number; octets: number } | null;
  isConfirmed: boolean;
}) => {
  const sansFichier = pieces.filter((p) => !p.contenu);
  console.log('Lignes de T&C, par table : lues = écrites + écartées');
  for (const b of bilan) {
    console.log(`  ${b.table} : ${b.lues} = ${b.ecrites} + ${b.ecartees}`);
  }
  console.log('Écarts par motif (ligne entière, ou partie « avis »)');
  printComptes(
    ecarts.map((e) => (e.precision ? `${e.motif} (${e.precision})` : e.motif))
  );

  console.log(
    `${fichiers.length} fichiers lus, dont ${
      [...avis.ecrits, ...avis.ecartes].flatMap((a) => a.fichiers).length
    } d'avis`
  );
  console.log(
    `${pieces.length} pièces de dossier (${
      pieces.flatMap((p) => p.fichiers).length - pieces.length
    } copies fondues), dont ${sansFichier.length} sans fichier dans l'archive`
  );
  console.log('Pièces par temps');
  printComptes(pieces.map((p) => p.temps));

  console.log('\nRangement');
  printComptes(
    rangements.map((r) =>
      r.niveau === 3
        ? `documents additionnels, ${r.raison.replace(/^\S+ : /, '')}`
        : `${r.niveau === 1 ? 'case' : 'PCAET global'}, ${r.documentId}`
    )
  );
  console.log(`Inclusions dans le PCAET global cochées : ${inclusions}`);
  printCas(
    'Délibérations : la case choisie',
    rangements.flatMap((r) =>
      r.niveau === 1 && r.documentId.includes('deliberation')
        ? [`${decrire(r.piece)} → ${r.documentId}`]
        : []
    )
  );
  printCas(
    'Documents additionnels, par leur nom',
    rangements.flatMap((r) =>
      r.niveau === 3 ? [`${decrire(r.piece)} (${r.raison})`] : []
    )
  );
  printCas(
    "Pièces sans fichier dans l'archive (sans téléchargement)",
    sansFichier.map(decrire)
  );

  console.log(`\nAvis écrits : ${avis.ecrits.length}`);
  printComptes(avis.ecrits.map((a) => a.titre.auTitreDe));
  console.log('Date des avis');
  printComptes(avis.ecrits.map((a) => a.dateVenueDe));
  console.log(`Avis écartés : ${avis.ecartes.length}`);
  printComptes(avis.ecartes.map((a) => a.motif));

  printCas(
    'Avis à plusieurs PDF : le fichier retenu',
    avis.ecrits
      .filter((a) => a.pdfs > 1)
      .map(
        (a) =>
          `${a.retenu.collectivite} (T&C ${a.retenu.dossierTecId}), ${a.titre.auTitreDe} : « ${a.retenu.nom} »`
      )
  );
  printCas(
    'Avis à un seul PDF, dont le nom ne dit ni avis, ni courrier, ni signé',
    avis.ecrits
      .filter((a) => a.pdfs === 1 && !isNomDAvis(a.retenu.nom))
      .map(
        (a) =>
          `${a.retenu.collectivite} (T&C ${a.retenu.dossierTecId}), ${a.titre.auTitreDe} : « ${a.retenu.nom} »`
      )
  );
  printCas(
    'Avis datés du jour de la transmission',
    avis.ecrits
      .filter((a) => a.dateVenueDe === 'transmission')
      .map(
        (a) =>
          `${a.retenu.collectivite} (T&C ${a.retenu.dossierTecId}), ${a.titre.auTitreDe} : ${a.date}`
      )
  );
  printCas(
    'Avis écartés',
    avis.ecartes.map(
      (a) =>
        `${a.fichiers[0].collectivite} (T&C ${a.fichiers[0].dossierTecId}), ${a.titre.auTitreDe} : ${a.motif}, ${a.fichiers.length} fichiers au dossier`
    )
  );

  console.log(
    `\nBibliothèque : ${bibliotheque.creees} lignes créées, ${bibliotheque.reutilisees} déjà là`
  );
  console.log(
    envoi
      ? `Stockage : ${envoi.fichiers} fichiers déposés, ${(
          envoi.octets / 1e9
        ).toFixed(2)} Go`
      : 'Stockage : rien déposé (simulation)'
  );

  console.log(
    isConfirmed
      ? '\nImport terminé.'
      : '\nSimulation : tout a été annulé. Relancer avec --confirm pour importer.'
  );
};

const decrire = (p: Piece) =>
  `${p.fichier.collectivite} (T&C ${p.fichier.dossierTecId}), ${p.temps} : « ${p.fichier.nom} »`;

const printComptes = (valeurs: readonly string[]) => {
  for (const v of [...new Set(valeurs)].sort()) {
    console.log(`  ${v} : ${valeurs.filter((x) => x === v).length}`);
  }
};

const printCas = (titre: string, cas: readonly string[]) => {
  console.log(`\n${titre} : ${cas.length}`);
  for (const c of cas) {
    console.log(`  ${c}`);
  }
};
