import type { Ecart } from '../import-fiches/ecarts';
import type { Valeur } from './fusion';
import type { Ligne } from './lignes';
import { toTexte } from './niveau';
import type { Thematique } from './thematiques';

export const printRapport = ({
  bilan,
  ecarts,
  lignes,
  valeurs,
  ecrites,
  dechets,
  isConfirmed,
}: {
  bilan: { table: string; lues: number; ecrites: number; ecartees: number }[];
  ecarts: readonly Ecart[];
  lignes: readonly Ligne[];
  valeurs: readonly Valeur[];
  ecrites: { lignes: number; demarches: number };
  dechets: { creees: number; reutilisees: number };
  isConfirmed: boolean;
}) => {
  const aEcrire = valeurs.filter((v) => v.aEcrire);
  const collectivites = new Map(
    lignes.map((l) => [l.collectiviteId, l.collectivite])
  );
  const toCollectivite = (id: number) => `${collectivites.get(id)} (${id})`;

  console.log('Lignes de T&C : lues = écrites + écartées');
  for (const b of bilan) {
    console.log(`  ${b.table} : ${b.lues} = ${b.ecrites} + ${b.ecartees}`);
  }
  console.log('Écarts par motif (ligne entière, puis partie de ligne)');
  printComptes(
    ecarts.map((e) =>
      e.precision === '' ? e.motif : `${e.precision}, ${e.motif}`
    )
  );

  console.log(
    `\n${ecrites.lignes} lignes de demarche_pcaet_vulnerabilite_valeur, sur ${ecrites.demarches} démarches :`
  );
  printComptes(aEcrire.map((v) => v.niveau ?? 'objectif sans niveau'));
  console.log(
    'Niveaux 2050 et 2100, objectifs 2100 : vides partout (T&C ne les demandait pas)'
  );
  console.log(
    `« Déchets » : ${dechets.creees} créées, ${dechets.reutilisees} réutilisées (déjà là dans la collectivité)`
  );

  printCas(
    'Fusions : lignes TeT qui réunissent plusieurs lignes T&C',
    valeurs
      .filter((v) => v.lignes.length > 1)
      .map((v) => {
        const origine = v.lignes
          .map(
            ({ ligne }) => `« ${toTexte(ligne.libelle)} » ${toNiveauLu(ligne)}`
          )
          .join(', ');
        const retenu = v.aEcrire ? v.niveau ?? 'sans niveau' : "rien d'écrit";
        const objectifs =
          v.lignes.filter((l) => l.ligne.objectif.objectif !== null).length > 1
            ? ` ; objectifs : ${v.objectifs}`
            : '';
        return `${toCollectivite(v.collectiviteId)}, démarche ${
          v.demarcheId
        }, ${toNom(v.thematique)} : ${origine} → ${retenu}${objectifs}`;
      })
  );
  printCas(
    'Libellés non reconnus (texte, nombre de lignes)',
    listNombres(
      lignes.filter((l) => l.thematique === null).map((l) => toTexte(l.libelle))
    )
  );
  const parId = new Map(lignes.map((l) => [l.id, l]));
  printCas(
    'Texte après le mot de niveau, sans place (lignes écrites)',
    ecarts
      .filter((e) => e.motif === 'texte_sans_place')
      .map((e) => {
        const l = parId.get(e.id) as Ligne;
        return `${toCollectivite(l.collectiviteId)}, ligne T&C ${l.id} : ${
          l.vulnerable.texte
        }`;
      })
  );
  const montrees = new Set(aEcrire.map((v) => v.demarcheId));
  printCas(
    "Dossiers repris qui avaient une vulnérabilité et n'en montrent rien",
    [
      ...new Map(
        lignes
          .filter((l) => !montrees.has(l.demarcheId))
          .map((l) => [
            l.demarcheId,
            `${toCollectivite(l.collectiviteId)} : dossier T&C ${
              l.dossierTecId
            }, démarche ${l.demarcheId}`,
          ])
      ).values(),
    ]
  );

  console.log(
    isConfirmed
      ? '\nImport terminé.'
      : '\nSimulation : tout a été annulé. Relancer avec --confirm pour importer.'
  );
};

const toNiveauLu = ({ vulnerable }: Ligne) =>
  vulnerable.niveau ?? (vulnerable.oui ? 'oui' : 'sans niveau');

const toNom = (thematique: Thematique) =>
  'code' in thematique ? thematique.code : thematique.label;

const listNombres = (valeurs: readonly string[]) => {
  const nombres = new Map<string, number>();
  for (const v of valeurs) {
    nombres.set(v, (nombres.get(v) ?? 0) + 1);
  }
  return [...nombres]
    .sort(([x, n], [y, m]) => m - n || x.localeCompare(y, 'fr'))
    .map(([v, n]) => `${v} : ${n}`);
};

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
