/** Les avis rendus : un par dossier transmis et par titre, son PDF retenu, sa date ; les fichiers qui ne deviennent pas l'avis vont au dossier. */

import {
  PcaetAvisAuTitreDeEnum,
  type PcaetAvisAuTitreDe,
} from '@tet/domain/demarches';
import { PoolClient } from 'pg';
import { correctDateSaisie } from '../import-demarches/dossier';
import type { SuiviAdeme } from '../import-demarches/suivi-ademe';
import type { Contenu } from './archive';
import type { Fichier } from './fichiers';

export type Titre = {
  typeFichierId: number;
  auTitreDe: PcaetAvisAuTitreDe;
  service: 'dreal' | 'region';
  // « président » seul ne dit pas lequel : « L à M. le Président du PETR »
  emetteur: RegExp;
  autreEmetteur: RegExp;
};

export const TITRES: readonly Titre[] = [
  {
    typeFichierId: 27,
    auTitreDe: PcaetAvisAuTitreDeEnum.PREFET_REGION,
    service: 'dreal',
    emetteur: /prefe|\betat\b|dreal|\bddt\b/,
    autreEmetteur: /region|\bpdt\b/,
  },
  {
    typeFichierId: 28,
    auTitreDe: PcaetAvisAuTitreDeEnum.PRESIDENT_REGION,
    service: 'region',
    emetteur: /region|\bpdt\b/,
    autreEmetteur: /prefe|\betat\b|dreal|\bddt\b/,
  },
];

export type Saisine = {
  demandeAvisId: number;
  emetteurId: number;
  aDejaUnAvis: boolean;
};

export type Avis = {
  titre: Titre;
  fichiers: Fichier[];
};

export type AvisEcrit = Avis & {
  saisine: Saisine;
  retenu: Fichier & { contenu: Contenu };
  pdfs: number;
  date: string;
  dateVenueDe: 'suivi ADEME' | 'nom du fichier' | 'envoi T&C' | 'transmission';
};

export type AvisEcarte = Avis & { motif: string };

const normalize = (nom: string) =>
  nom
    .normalize('NFD')
    .replace(/\p{Mn}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ');

/** Le nom dit-il un avis : avis, courrier ou signé ? */
export const isNomDAvis = (nom: string) =>
  /avis|courrier|sign/.test(normalize(nom));

/** Les saisines des dossiers repris par la DREAL ou la région : l'avis se rattache à la principale. */
export const loadSaisines = async (client: PoolClient) => {
  const { rows } = await client.query<
    Saisine & { demarcheId: number; service: string; perimetre: string }
  >(
    `select a.demarche_id as "demarcheId", s.type as service, a.perimetre,
            a.id as "demandeAvisId", a.instructeur_collectivite_id as "emetteurId",
            exists (select from public.demarche_pcaet_avis v
                     where v.demande_avis_id = a.id) as "aDejaUnAvis"
       from public.demarche_pcaet_demande_avis a
       join public.collectivite s on s.id = a.instructeur_collectivite_id
      where s.type in ('dreal', 'region')`
  );
  const cle = (r: { demarcheId: number; service: string }) =>
    `${r.demarcheId}|${r.service}`;
  const principales = new Map(
    rows.filter((r) => r.perimetre === 'principal').map((r) => [cle(r), r])
  );
  const avecSecondaire = new Set(
    rows.filter((r) => r.perimetre !== 'principal').map(cle)
  );
  return {
    getPrincipale: (demarcheId: number, service: string) =>
      principales.get(cle({ demarcheId, service })),
    hasSecondaire: (demarcheId: number, service: string) =>
      avecSecondaire.has(cle({ demarcheId, service })),
  };
};

/** Regroupe les fichiers d'avis par dossier et titre, sur les deux lignes de la paire. */
export const groupAvis = (fichiers: readonly Fichier[]) => {
  const avis = new Map<string, Avis>();
  for (const f of fichiers) {
    const titre = TITRES.find((t) => t.typeFichierId === f.typeFichierId);
    if (!titre) {
      continue;
    }
    const cle = `${f.demarcheId}|${titre.auTitreDe}`;
    const un = avis.get(cle) ?? { titre, fichiers: [] };
    un.fichiers.push(f);
    avis.set(cle, un);
  }
  return [...avis.values()];
};

/** Règle : un PDF dont le nom dit avis, courrier ou signé (ni annexe, ni MRAe, ni réponse), qui nomme l'émetteur du titre, signé ou courrier, puis le plus ancien. */
export const chooseFichier = <F extends Fichier>(titre: Titre, pdfs: F[]) => {
  if (pdfs.length === 1) {
    return pdfs[0];
  }
  const noms = (f: F) => normalize(f.nom);
  const candidats = pdfs.filter(
    (f) =>
      isNomDAvis(f.nom) &&
      !/annexe|mrae|autorite environnementale|reponse/.test(noms(f))
  );
  const nommentEmetteur = candidats.filter(
    (f) => titre.emetteur.test(noms(f)) || !titre.autreEmetteur.test(noms(f))
  );
  const parmi = nommentEmetteur.length > 0 ? nommentEmetteur : candidats;
  const preferes = parmi.filter((f) => titre.emetteur.test(noms(f)));
  const restants = preferes.length > 0 ? preferes : parmi;
  const signes = restants.filter((f) => /sign|courrier/.test(noms(f)));
  return (signes.length > 0 ? signes : restants)[0];
};

const DATES_DANS_UN_NOM =
  /(?<!\d)(20\d\d) ?(\d\d) ?(\d\d)(?!\d)|(?<!\d)(\d\d) (\d\d) (20\d\d)(?!\d)|(?<!\d)(\d\d)(\d\d)(\d\d)(?!\d)/g;

/** Règle : la première date valide écrite dans le nom du fichier. */
export const readDateDuNom = (nom: string) => {
  for (const m of normalize(nom.replace(/\.[^.]+$/, '')).matchAll(
    DATES_DANS_UN_NOM
  )) {
    const [annee, mois, jour] = m[1]
      ? [m[1], m[2], m[3]]
      : m[4]
      ? [m[6], m[5], m[4]]
      : [`20${m[7]}`, m[8], m[9]];
    const date = `${annee}-${mois}-${jour}`;
    const lue = new Date(`${date}T00:00:00Z`);
    if (
      !Number.isNaN(lue.getTime()) &&
      lue.toISOString().startsWith(date) &&
      Number(annee) >= 2015 &&
      Number(annee) <= new Date().getUTCFullYear()
    ) {
      return date;
    }
  }
  return null;
};

const ajouterUnAn = (jour: string) =>
  `${Number(jour.slice(0, 4)) + 1}${jour.slice(4, 10)}`;

/** Règle : suivi ADEME dans l'année, puis date du nom, puis date « envoi », la première qui ne précède pas la transmission ; sinon, à moins d'un an avant, la transmission. */
export const decideDate = (
  avis: Avis,
  retenu: Fichier,
  suivi: SuiviAdeme
): Pick<AvisEcrit, 'date' | 'dateVenueDe'> | null => {
  const transmission = retenu.transmisLe!.slice(0, 10);
  const dansSuivi =
    avis.titre.auTitreDe === PcaetAvisAuTitreDeEnum.PREFET_REGION
      ? suivi.getLigne(retenu.siren)?.avisEtat ?? null
      : null;
  const envoi = correctDateSaisie(
    avis.titre.auTitreDe === PcaetAvisAuTitreDeEnum.PREFET_REGION
      ? retenu.envoiDreal
      : retenu.envoiCr
  )?.slice(0, 10);
  const dates = [
    {
      date:
        dansSuivi && dansSuivi <= ajouterUnAn(transmission) ? dansSuivi : null,
      dateVenueDe: 'suivi ADEME' as const,
    },
    { date: readDateDuNom(retenu.nom), dateVenueDe: 'nom du fichier' as const },
    { date: envoi ?? null, dateVenueDe: 'envoi T&C' as const },
  ];
  const retenue = dates.find((d) => d.date !== null && d.date >= transmission);
  if (retenue?.date) {
    return { date: retenue.date, dateVenueDe: retenue.dateVenueDe };
  }
  const plusTardive = dates
    .map((d) => d.date)
    .filter((d): d is string => d !== null)
    .sort()
    .pop();
  return plusTardive && ajouterUnAn(plusTardive) >= transmission
    ? { date: transmission, dateVenueDe: 'transmission' }
    : null;
};

/** Décide de chaque avis : écrit avec son PDF et sa date, ou écarté ; les fichiers qui ne deviennent pas l'avis vont au dossier. */
export const buildAvis = (
  avis: readonly Avis[],
  contenus: ReadonlyMap<number, Contenu>,
  saisines: Awaited<ReturnType<typeof loadSaisines>>,
  suivi: SuiviAdeme
) => {
  const ecrits: AvisEcrit[] = [];
  const ecartes: AvisEcarte[] = [];
  const auDossier: Fichier[] = [];
  const sansSaisine: (Avis & { secondaire: boolean })[] = [];

  for (const un of avis) {
    const premier = un.fichiers[0];
    const presents = [
      ...new Map(
        un.fichiers.flatMap((f) => {
          const contenu = contenus.get(f.tecId);
          return contenu
            ? [[contenu.empreinte, { ...f, contenu }] as const]
            : [];
        })
      ).values(),
    ];
    const ecarter = (motif: string) => {
      ecartes.push({ ...un, motif });
      auDossier.push(...un.fichiers);
    };

    if (premier.transmisLe === null) {
      ecarter('avis_sans_transmission');
      continue;
    }
    if (presents.length === 0) {
      ecarter('avis_sans_fichier');
      continue;
    }
    const pdfs = presents.filter((f) => f.contenu.estPdf);
    if (pdfs.length === 0) {
      ecarter('avis_sans_pdf');
      continue;
    }
    const retenu = chooseFichier(un.titre, pdfs);
    if (retenu === undefined) {
      ecarter('avis_sans_courrier');
      continue;
    }
    const date = decideDate(un, retenu, suivi);
    if (date === null) {
      ecarter('avis_anterieur');
      continue;
    }
    const saisine = saisines.getPrincipale(
      premier.demarcheId,
      un.titre.service
    );
    if (saisine === undefined) {
      sansSaisine.push({
        ...un,
        secondaire: saisines.hasSecondaire(
          premier.demarcheId,
          un.titre.service
        ),
      });
      continue;
    }
    ecrits.push({ ...un, saisine, retenu, pdfs: pdfs.length, ...date });
    auDossier.push(
      ...un.fichiers.filter(
        (f) => contenus.get(f.tecId)?.empreinte !== retenu.contenu.empreinte
      )
    );
  }
  // Un avis conjoint sert aux deux titres : retenu pour l'un, il ne va pas au dossier pour l'autre.
  const retenus = new Set(
    ecrits.map((a) => `${a.retenu.demarcheId}|${a.retenu.contenu.empreinte}`)
  );
  return {
    ecrits,
    ecartes,
    sansSaisine,
    auDossier: auDossier.filter(
      (f) => !retenus.has(`${f.demarcheId}|${contenus.get(f.tecId)?.empreinte}`)
    ),
  };
};

/** Garde, appelée par `gardes.ts` : un avis sans saisine principale, ou sur une saisine qui a déjà un avis. */
export const listCasBloquantsAvis = ({
  ecrits,
  sansSaisine,
}: Pick<ReturnType<typeof buildAvis>, 'ecrits' | 'sansSaisine'>) => [
  ...sansSaisine.map(
    (a) =>
      `  avis ${a.titre.auTitreDe} sans saisine principale ${a.titre.service}${
        a.secondaire ? ' (seulement une secondaire)' : ''
      } : ${a.fichiers[0].collectivite}, T&C ${a.fichiers[0].dossierTecId}`
  ),
  ...ecrits
    .filter((a) => a.saisine.aDejaUnAvis)
    .map(
      (a) =>
        `  saisine ${a.saisine.demandeAvisId} qui a déjà un avis : ${a.retenu.collectivite}, T&C ${a.retenu.dossierTecId}, ${a.titre.auTitreDe}`
    ),
];
