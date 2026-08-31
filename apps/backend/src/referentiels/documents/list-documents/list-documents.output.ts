import {
  etoileAsStringEnumSchema,
  referentielIdEnumSchema,
  sujetDemandeEnumSchema,
} from '@tet/domain/referentiels';
import z from 'zod';

const fichierSchema = z.object({
  id: z.number(),
  collectivite_id: z.number(),
  hash: z.string(),
  filename: z.string(),
  confidentiel: z.boolean().nullable(),
  bucket_id: z.string(),
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
  collectivite_id: z.number(),
  fichier_id: z.number().nullable(),
  url: z.string().nullable(),
  titre: z.string().nullable(),
  commentaire: z.string().nullable(),
  modified_at: z.string(),
  modified_by: z.string().nullable(),
  created_at: z.string(),
  created_by: z.string().nullable(),
  created_by_nom: z.string().nullable(),
  action: z.null(),
  preuve_reglementaire: z.null(),
});

const demandeSchema = z.object({
  id: z.number(),
  collectivite_id: z.number(),
  referentiel: referentielIdEnumSchema,
  en_cours: z.boolean(),
  etoiles: z.nullable(etoileAsStringEnumSchema),
  date: z.string(),
  sujet: z.nullable(sujetDemandeEnumSchema),
  modified_at: z.string().nullable(),
  envoyee_le: z.string().nullable(),
  demandeur: z.string().nullable(),
  associated_collectivite_id: z.number().nullable(),
});

const auditSchema = z.object({
  id: z.number(),
  collectivite_id: z.number(),
  referentiel_id: referentielIdEnumSchema,
  demande_id: z.number().nullable(),
  date_debut: z.string().nullable(),
  date_fin: z.string().nullable(),
  valide: z.boolean(),
  date_cnl: z.string().nullable(),
  valide_labellisation: z.boolean().nullable(),
  clos: z.boolean(),
});

const documentLabellisationSchema = documentBaseSchema
  .extend({
    preuve_type: z.literal('labellisation'),
    demande_id: z.number(),
    objet: z.enum(['acte_engagement', 'candidature']).nullable(),
    demande: demandeSchema,
    audit: z.null(),
    rapport: z.null(),
  })
  .and(supportSchema);

const documentAuditSchema = documentBaseSchema
  .extend({
    preuve_type: z.literal('audit'),
    audit_id: z.number(),
    demande: demandeSchema.nullable(),
    audit: auditSchema,
    rapport: z.null(),
  })
  .and(supportSchema);

const documentRapportSchema = documentBaseSchema
  .extend({
    preuve_type: z.literal('rapport'),
    date: z.string(),
    demande: z.null(),
    audit: z.null(),
    rapport: z.object({ date: z.string() }),
  })
  .and(supportSchema);

export const listDocumentsOutputSchema = z.object({
  labellisation: z.array(documentLabellisationSchema),
  audit: z.array(documentAuditSchema),
  rapport: z.array(documentRapportSchema),
});

export type ListDocumentsOutput = z.infer<typeof listDocumentsOutputSchema>;
