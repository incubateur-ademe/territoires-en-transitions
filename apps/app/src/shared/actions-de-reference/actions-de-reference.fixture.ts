import { ficheWithRelationsSchema } from '@tet/domain/plans';
import {
  type ActionDeReference,
  actionDeReferenceSchema,
} from '@tet/domain/shared';
import type {
  ActionDeReferenceFiche,
  ActionDeReferenceInterestControl,
} from './actions-de-reference.contract';

export const isolationComblesAction: ActionDeReference =
  actionDeReferenceSchema.parse({
    id: 1,
    titre: 'Isoler les combles perdus des bâtiments communaux',
    description:
      "Programmer l'isolation des combles perdus des écoles et des équipements sportifs.",
    levier: 'sobriete_isolation_batiments_tertiaire',
    categorie: 'exemplarite',
  });

export const aireCovoiturageAction: ActionDeReference =
  actionDeReferenceSchema.parse({
    id: 2,
    titre: 'Aménager des aires de covoiturage',
    description:
      'Créer des aires de covoiturage aux entrées du territoire et les signaler.',
    levier: 'covoiturage',
    categorie: 'amenagement',
  });

export const longDescriptionAction: ActionDeReference =
  actionDeReferenceSchema.parse({
    id: 3,
    titre: 'Planter et gérer durablement les haies bocagères',
    description: [
      'Établir un diagnostic du linéaire de haies avec les exploitants agricoles du territoire.',
      "Financer la plantation de haies champêtres d'essences locales et leur entretien sur dix ans.",
      'Accompagner la valorisation du bois de taille en plaquettes pour les chaufferies collectives.',
      'Suivre chaque année le linéaire planté, le taux de reprise et le carbone stocké.',
    ].join('\n\n'),
    levier: 'gestion_haies',
    categorie: 'financement',
  });

type FicheFixtureInput = Pick<
  ActionDeReferenceFiche,
  | 'id'
  | 'titre'
  | 'description'
  | 'collectiviteId'
  | 'collectiviteNom'
  | 'restreint'
>;

export const toFicheFixture = (
  input: FicheFixtureInput
): ActionDeReferenceFiche =>
  ficheWithRelationsSchema.parse({
    ...input,
    parentId: null,
    piliersEci: null,
    objectifs: null,
    cibles: null,
    ressources: null,
    financements: null,
    budgetPrevisionnel: null,
    statut: null,
    priorite: null,
    dateDebut: null,
    dateFin: null,
    ameliorationContinue: null,
    participationCitoyenne: null,
    participationCitoyenneType: null,
    tempsDeMiseEnOeuvre: null,
    majTermine: null,
    createdAt: '2026-01-15T10:00:00.000Z',
    createdBy: null,
    modifiedAt: '2026-02-01T10:00:00.000Z',
    modifiedBy: null,
    partenaires: null,
    pilotes: null,
    referents: null,
    libreTags: null,
    instanceGouvernance: null,
    financeurs: null,
    sousThematiques: null,
    thematiques: null,
    structures: null,
    sharedWithCollectivites: null,
    indicateurs: null,
    services: null,
    effetsAttendus: null,
    axes: null,
    plans: null,
    etapes: null,
    notes: null,
    mesures: null,
    fichesLiees: null,
    docs: null,
    budgets: null,
    actionImpactId: null,
    completion: { ficheId: input.id, fields: [], isCompleted: false },
  });

export const linkedFichesFixture: readonly ActionDeReferenceFiche[] = [
  toFicheFixture({
    id: 1,
    titre: 'Inventaire énergétique du patrimoine',
    description:
      'Relevé des consommations de 60 bâtiments et classement par priorité de travaux.',
    collectiviteId: 10,
    collectiviteNom: 'CA Porte de l Isère',
    restreint: false,
  }),
  toFicheFixture({
    id: 2,
    titre: 'Fonds de concours rénovation des bâtiments communaux',
    description:
      'Cofinancement à 50 % des audits et travaux de rénovation énergétique des mairies et écoles.',
    collectiviteId: 20,
    collectiviteNom: 'Métropole de Lyon',
    restreint: false,
  }),
  toFicheFixture({
    id: 3,
    titre: 'Plan pluriannuel de rénovation du patrimoine',
    description: null,
    collectiviteId: 30,
    collectiviteNom: 'Ville de Rennes',
    restreint: false,
  }),
];

export const noInterest: ActionDeReferenceInterestControl = {
  status: 'disponible',
  onToggleSaved: () => undefined,
  onDismiss: () => undefined,
};
