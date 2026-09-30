import {
  type ActionDeReference,
  actionDeReferenceSchema,
} from '@tet/domain/shared';

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
