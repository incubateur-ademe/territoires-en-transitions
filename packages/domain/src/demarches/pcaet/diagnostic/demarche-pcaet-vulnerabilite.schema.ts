import * as z from 'zod/mini';
import { demarchePcaetVulnerabiliteNiveauSchema } from './demarche-pcaet-vulnerabilite-niveau.enum.schema';

/** Longueur maximale d'une thématique ajoutée par une collectivité. */
export const VULNERABILITE_THEMATIQUE_LABEL_MAX = 120;

/**
 * Longueur maximale d'un objectif d'adaptation. Portée par la thématique pour que
 * le champ de saisie borne au même endroit que l'API : sinon un texte trop long
 * n'est refusé qu'à l'enregistrement, une fois la cellule refermée.
 */
export const OBJECTIFS_MAX_LENGTH = 2000;

/**
 * Une thématique ou milieu de vulnérabilité. Le socle vient du cadre de dépôt et
 * s'impose à toutes les collectivités ; une collectivité peut en ajouter, et
 * ceux-là seuls sont renommables et supprimables.
 */
export const demarchePcaetVulnerabiliteThematiqueSchema = z.object({
  id: z.number(),
  /** Identifiant métier stable du socle, `null` pour une thématique ajoutée. */
  code: z.nullable(z.string()),
  label: z.string(),
  /** Une thématique requise doit être renseignée pour que le volet soit complet. */
  requis: z.boolean(),
  /** Une thématique du socle ne peut être ni renommée ni supprimée. */
  isSocle: z.boolean(),
});

export type DemarchePcaetVulnerabiliteThematique = z.infer<
  typeof demarchePcaetVulnerabiliteThematiqueSchema
>;

/**
 * La saisie d'une démarche pour une thématique. Un `null` est une absence de
 * saisie, jamais un « non concerné » — celui-ci est un niveau à part entière.
 */
export const demarchePcaetVulnerabiliteLigneSchema = z.object({
  thematiqueId: z.number(),
  niveauMaintenant: z.nullable(demarchePcaetVulnerabiliteNiveauSchema),
  niveau2050: z.nullable(demarchePcaetVulnerabiliteNiveauSchema),
  niveau2100: z.nullable(demarchePcaetVulnerabiliteNiveauSchema),
  objectifs2050: z.nullable(z.string()),
  objectifs2100: z.nullable(z.string()),
});

export type DemarchePcaetVulnerabiliteLigne = z.infer<
  typeof demarchePcaetVulnerabiliteLigneSchema
>;

/**
 * Le volet vulnérabilité tel qu'il est servi : les thématiques applicables à la
 * collectivité et la saisie de la démarche. Chaque thématique a sa ligne, même
 * vierge, pour que le front n'ait pas deux formes à gérer.
 */
export const demarchePcaetVulnerabiliteSchema = z.object({
  thematiques: z.array(demarchePcaetVulnerabiliteThematiqueSchema),
  lignes: z.array(demarchePcaetVulnerabiliteLigneSchema),
});

export type DemarchePcaetVulnerabilite = z.infer<
  typeof demarchePcaetVulnerabiliteSchema
>;
