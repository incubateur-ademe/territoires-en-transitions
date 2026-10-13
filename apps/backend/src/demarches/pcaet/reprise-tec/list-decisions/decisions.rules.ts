import { DemarchePcaetStatusEnum } from '@tet/domain/demarches';
import type {
  DossierRecette,
  EcartRecette,
} from '../shared/dossiers-recette.repository';

export type EtatDecision = 'ouverte' | 'prise';

type Critere =
  | { type: 'dossier'; estConcerne: (d: DossierRecette) => boolean }
  | {
      type: 'ecart';
      estConcerne: (e: Pick<EcartRecette, 'motif' | 'precision'>) => boolean;
    };

export type Decision = {
  code: string;
  sections: number[];
  etat: EtatDecision;
  critere: Critere;
};

const estRepris = (d: DossierRecette) => d.statut !== null;
const motifs =
  (...liste: string[]) =>
  (e: Pick<EcartRecette, 'motif'>) =>
    liste.includes(e.motif);

export const DECISIONS: Decision[] = [
  {
    code: 'D1',
    sections: [1, 12],
    etat: 'ouverte',
    critere: { type: 'dossier', estConcerne: (d) => estRepris(d) && !d.etat },
  },
  {
    code: 'D2',
    sections: [1],
    etat: 'prise',
    critere: {
      type: 'dossier',
      estConcerne: (d) =>
        d.etat === 'en_cours_elaboration' &&
        d.statut === DemarchePcaetStatusEnum.PUBLIE,
    },
  },
  {
    code: 'D3',
    sections: [1],
    etat: 'prise',
    critere: {
      type: 'dossier',
      estConcerne: (d) =>
        d.etat === 'depot_pour_avis' &&
        d.statut === DemarchePcaetStatusEnum.INSTRUIT,
    },
  },
  {
    code: 'D4',
    sections: [1],
    etat: 'prise',
    critere: {
      type: 'dossier',
      estConcerne: (d) => d.motif === 'elaboration_remplacee',
    },
  },
  {
    code: 'D5',
    sections: [1],
    etat: 'prise',
    critere: {
      type: 'dossier',
      estConcerne: (d) => d.motif === 'elaboration_doublon',
    },
  },
  {
    code: 'D6',
    sections: [2],
    etat: 'prise',
    critere: {
      type: 'dossier',
      estConcerne: (d) => d.adoptionDecideePar === 'repli',
    },
  },
  {
    code: 'D7',
    sections: [2],
    etat: 'prise',
    critere: {
      type: 'dossier',
      estConcerne: (d) =>
        !!d.transmisLe &&
        !!d.transmisDansTec &&
        d.transmisLe !== d.transmisDansTec,
    },
  },
  {
    code: 'D8',
    sections: [2],
    etat: 'prise',
    critere: {
      type: 'dossier',
      estConcerne: (d) =>
        estRepris(d) && !!d.lanceBrut && Number(d.lanceBrut.slice(0, 4)) < 2000,
    },
  },
  {
    code: 'D9',
    sections: [13],
    etat: 'ouverte',
    critere: { type: 'dossier', estConcerne: estRepris },
  },
  {
    code: 'D10',
    sections: [3],
    etat: 'prise',
    critere: {
      type: 'dossier',
      estConcerne: (d) => estRepris(d) && d.oblige === null,
    },
  },
  {
    code: 'D11',
    sections: [6],
    etat: 'prise',
    critere: {
      type: 'ecart',
      estConcerne: (e) => e.motif.startsWith('avis_'),
    },
  },
  {
    code: 'D12',
    sections: [8],
    etat: 'prise',
    critere: { type: 'ecart', estConcerne: motifs('elu_referent_texte_libre') },
  },
  {
    code: 'D13',
    sections: [8],
    etat: 'prise',
    critere: { type: 'ecart', estConcerne: motifs('contact_instructeur') },
  },
  {
    code: 'D14',
    sections: [9],
    etat: 'prise',
    critere: { type: 'ecart', estConcerne: motifs('objectif_sans_colonne') },
  },
  {
    code: 'D15',
    sections: [9],
    etat: 'prise',
    critere: { type: 'ecart', estConcerne: motifs('total_recalcule') },
  },
  {
    code: 'D16',
    sections: [9],
    etat: 'prise',
    critere: { type: 'dossier', estConcerne: (d) => estRepris(d) && d.melange },
  },
  {
    code: 'D17',
    sections: [9],
    etat: 'prise',
    critere: { type: 'ecart', estConcerne: motifs('commentaire_sans_place') },
  },
  {
    code: 'D18',
    sections: [10],
    etat: 'prise',
    critere: { type: 'ecart', estConcerne: motifs('oui_sans_niveau') },
  },
  {
    code: 'D19',
    sections: [10],
    etat: 'prise',
    critere: { type: 'ecart', estConcerne: motifs('libelle_non_normalise') },
  },
  {
    code: 'D20',
    sections: [7, 11],
    etat: 'prise',
    critere: {
      type: 'ecart',
      estConcerne: (e) =>
        e.motif === 'sans_place' &&
        ['population_couverte', 'fiche_action_associee'].includes(e.precision),
    },
  },
];
