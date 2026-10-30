/** Le rapport : ce que l'import a lu, écrit et écarté, et les cas à connaître. */

import type { Ecart } from '../import-fiches/ecarts';
import type { EluReferent } from './ecarts';
import type { PiloteDossier, PiloteFiche } from './pilotes';

/** Affiche le bilan par table, les écarts par motif, ce qui est écrit, et les cas nommés. */
export const printRapport = ({
  bilan,
  ecarts,
  pilotes,
  personneTags,
  pilotesDossiers,
  pilotesFiches,
  dossiersSansPilote,
  elusReferents,
  isConfirmed,
}: {
  bilan: { table: string; lues: number; ecrites: number; ecartees: number }[];
  ecarts: readonly Ecart[];
  pilotes: {
    dossiers: readonly PiloteDossier[];
    fiches: readonly PiloteFiche[];
  };
  personneTags: { creees: number; reutilisees: number };
  pilotesDossiers: { pilotes: number; demarches: number };
  pilotesFiches: { pilotes: number; fiches: number };
  dossiersSansPilote: readonly string[];
  elusReferents: readonly EluReferent[];
  isConfirmed: boolean;
}) => {
  const tous = [...pilotes.dossiers, ...pilotes.fiches];

  console.log('Lignes de T&C, par table : lues = écrites + écartées');
  for (const b of bilan) {
    console.log(`  ${b.table} : ${b.lues} = ${b.ecrites} + ${b.ecartees}`);
  }
  console.log('Écarts par table et par motif');
  printComptes(ecarts.map((e) => `${e.table}, ${e.motif}`));

  console.log(
    `\n${personneTags.creees + personneTags.reutilisees} personne_tag : ${
      personneTags.creees
    } créés, ${personneTags.reutilisees} réutilisés (déjà là sous le même nom)`
  );
  console.log(
    `${pilotesDossiers.pilotes} pilotes de dossier, sur ${pilotesDossiers.demarches} démarches`
  );
  console.log(
    `${pilotesFiches.pilotes} pilotes de fiche, sur ${pilotesFiches.fiches} fiches`
  );

  printCas(
    'personne_tag de même nom à la casse ou aux accents près (deux personne_tag)',
    listPairesCasseAccent(tous)
  );
  printCas(
    'Utilisateurs T&C réunis sous un même nom dans une collectivité',
    listHomonymes(tous)
  );
  printCas(
    'Pilotes rattachés dans T&C à une autre collectivité (créés dans celle du dossier)',
    [
      ...new Set(
        pilotes.dossiers.flatMap((p) =>
          p.autreCollectiviteTec === null
            ? []
            : [
                `${p.nom}, pilote dans ${p.collectivite}, rattaché dans T&C à ${p.autreCollectiviteTec}`,
              ]
        )
      ),
    ]
  );
  printCas('Dossiers repris sans pilote', dossiersSansPilote);
  printCas(
    "Élus référents tapés à la main qui ne sont qu'un nom (en écart, aucun pilote)",
    elusReferents
      .filter((e) => isJusteUnNom(e.texte))
      .map(
        (e) => `${e.collectivite}, dossier T&C ${e.dossierTecId} : ${e.texte}`
      )
  );

  console.log(
    isConfirmed
      ? '\nImport terminé.'
      : '\nSimulation : tout a été annulé. Relancer avec --confirm pour importer.'
  );
};

/** Les noms d'une même collectivité qui ne diffèrent que par la casse ou les accents. */
const listPairesCasseAccent = (
  pilotes: readonly (PiloteDossier | PiloteFiche)[]
) =>
  listGroupes(
    pilotes,
    (p) =>
      `${p.collectiviteId}|${p.nom
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .toLowerCase()}`,
    (p) => p.nom
  ).map(
    ({ collectivite, valeurs }) =>
      `${collectivite} : ${valeurs.map((n) => `« ${n} »`).join(' / ')}`
  );

/** Les noms qui réunissent plusieurs utilisateurs T&C dans une même collectivité. */
const listHomonymes = (pilotes: readonly (PiloteDossier | PiloteFiche)[]) =>
  listGroupes(
    pilotes,
    (p) => `${p.collectiviteId}|${p.nom}`,
    (p) => String(p.utilisateurId)
  ).map(
    ({ collectivite, nom, valeurs }) =>
      `${collectivite} : ${nom} (utilisateurs T&C ${valeurs.join(', ')})`
  );

/** Regroupe les pilotes par clé (toujours dans une collectivité, par son id) ; rend les groupes à plusieurs valeurs. */
const listGroupes = (
  pilotes: readonly (PiloteDossier | PiloteFiche)[],
  toCle: (p: PiloteDossier | PiloteFiche) => string,
  toValeur: (p: PiloteDossier | PiloteFiche) => string
) => {
  const groupes = new Map<
    string,
    { collectivite: string; nom: string; valeurs: Set<string> }
  >();
  for (const p of pilotes) {
    const cle = toCle(p);
    const groupe = groupes.get(cle) ?? {
      collectivite: p.collectivite,
      nom: p.nom,
      valeurs: new Set<string>(),
    };
    groupe.valeurs.add(toValeur(p));
    groupes.set(cle, groupe);
  }
  return [...groupes.values()]
    .filter((g) => g.valeurs.size > 1)
    .map((g) => ({
      ...g,
      valeurs: [...g.valeurs].sort((x, y) =>
        x.localeCompare(y, 'fr', { numeric: true })
      ),
    }))
    .sort((x, y) => x.collectivite.localeCompare(y.collectivite, 'fr'));
};

/** Un élu référent tapé à la main qui n'est qu'un nom : deux à quatre mots, sans ponctuation, chiffre, « et », civilité ni fonction. */
const isJusteUnNom = (texte: string) =>
  !/[,;/()&+:0-9]|\set\s|\s-\s|^(m\.|mme|mr|monsieur|madame|m )|président|vice|maire|conseill|adjoint|délégu|élu/i.test(
    texte
  ) &&
  texte.split(' ').length >= 2 &&
  texte.split(' ').length <= 4;

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
