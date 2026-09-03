import {
  etoileAsStringEnumSchema,
  referentielIdEnumSchema,
  sujetDemandeEnumSchema,
} from '@tet/domain/referentiels';
import z from 'zod';

const fichierSchema = z.object({
  id: z.number(),
  collectiviteId: z.number(),
  hash: z.string(),
  filename: z.string(),
  confidentiel: z.boolean().nullable(),
  bucketId: z.string(),
  filesize: z
    .number()
    .nullable()
    .transform((filesize) => filesize ?? undefined),
});

const supportSchema = z.union([
  z.object({ fichier: fichierSchema, lien: z.null() }),
  z.object({ fichier: z.null(), lien: z.null() }),
]);

const documentBaseSchema = z.object({
  id: z.number(),
  collectiviteId: z.number(),
  fichierId: z.number().nullable(),
  url: z.string().nullable(),
  titre: z.string().nullable(),
  commentaire: z.string().nullable(),
  modifiedAt: z.string(),
  modifiedBy: z.string().nullable(),
  modifiedByNom: z.string().nullable(),
});

const demandeSchema = z.object({
  id: z.number(),
  collectiviteId: z.number(),
  referentiel: referentielIdEnumSchema,
  enCours: z.boolean(),
  etoiles: z.nullable(etoileAsStringEnumSchema),
  date: z.string(),
  sujet: z.nullable(sujetDemandeEnumSchema),
  modifiedAt: z.string().nullable(),
  envoyeeLe: z.string().nullable(),
  demandeur: z.string().nullable(),
  associatedCollectiviteId: z.number().nullable(),
});

const auditSchema = z.object({
  id: z.number(),
  collectiviteId: z.number(),
  referentielId: referentielIdEnumSchema,
  demandeId: z.number().nullable(),
  dateDebut: z.string().nullable(),
  dateFin: z.string().nullable(),
  valide: z.boolean(),
  dateCnl: z.string().nullable(),
  valideLabellisation: z.boolean().nullable(),
  clos: z.boolean(),
});

const documentLabellisationSchema = documentBaseSchema
  .extend({
    preuveType: z.literal('labellisation'),
    demandeId: z.number(),
    objet: z.enum(['acte_engagement', 'candidature']).nullable(),
    demande: demandeSchema,
  })
  .and(supportSchema);

const documentAuditSchema = documentBaseSchema
  .extend({
    preuveType: z.literal('audit'),
    auditId: z.number(),
    demande: demandeSchema.nullable(),
    audit: auditSchema,
  })
  .and(supportSchema);

const documentRapportSchema = documentBaseSchema
  .extend({
    preuveType: z.literal('rapport'),
    date: z.string(),
    rapport: z.object({ date: z.string() }),
  })
  .and(supportSchema);

export const listDocumentsReferentielOutputSchema = z.object({
  labellisation: z.array(documentLabellisationSchema),
  audit: z.array(documentAuditSchema),
  rapport: z.array(documentRapportSchema),
});

export type ListDocumentsReferentielOutput = z.infer<typeof listDocumentsReferentielOutputSchema>;
