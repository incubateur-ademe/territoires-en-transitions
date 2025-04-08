import z from 'zod';
import { ficheActionWithRelationsSchema } from '../shared/models/fiche-action-with-relations.dto';

export const ficheActionForCountBySchema = ficheActionWithRelationsSchema.pick({
  restreint: true,
  ameliorationContinue: true,
  cibles: true,
  statut: true,
  priorite: true,
  partenaires: true,
  structures: true,
  pilotes: true,
  services: true,
  tags: true,
  financeurs: true,
  thematiques: true,
  plans: true,
  referents: true,
  participationCitoyenneType: true,
  effetsAttendus: true,
  sousThematiques: true,
  indicateurs: true,
  dateDebut: true,
  dateFin: true,
  createdAt: true,
  modifiedAt: true,
  budgetsPrevisionnelInvestissementTotal : true,
  budgetsPrevisionnelInvestissementParAnnee : true,
  budgetsDepenseInvestissementTotal : true,
  budgetsDepenseInvestissementParAnnee : true,
  budgetsPrevisionnelFonctionnementTotal : true,
  budgetsPrevisionnelFonctionnementParAnnee : true,
  budgetsDepenseFonctionnementTotal : true,
  budgetsDepenseFonctionnementParAnnee : true,
});

export const countByPropertyOptions =
  ficheActionForCountBySchema.keyof().options;

export const countByPropertyEnumSchema = z.enum(countByPropertyOptions);

export type CountByPropertyEnumType = z.infer<typeof countByPropertyEnumSchema>;
