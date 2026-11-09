import { epciCandidatSchema } from '@tet/domain/demarches';
import { z } from 'zod';

export const depotContextSchema = z.object({
  /**
   * La question « votre PCAET est-il un SCoT-AEC ? » doit-elle être posée ?
   *
   * Vrai quand la collectivité exerce la compétence Banatic 5500 (SCOT). Le
   * serveur répond par oui ou non plutôt que de livrer la compétence brute : le
   * formulaire n'a pas à connaître la nomenclature Banatic pour savoir quoi
   * afficher.
   */
  peutDeclarerScotAec: z.boolean(),
  /**
   * La collectivité est un Supra (PETR, pôle métropolitain, syndicat) : elle
   * dépose pour le compte d'EPCI à fiscalité propre, qu'elle coche à la
   * création.
   */
  estSupra: z.boolean(),
  /** Les EPCI membres du Supra, à cocher. Vide hors Supra. */
  epciCandidats: z.array(epciCandidatSchema),
  /**
   * Les EPCI couverts par le dernier dépôt abouti du Supra : en renouvellement,
   * ils sont pré-cochés. Vide pour un premier dépôt.
   */
  perimetrePrecedent: z.array(z.number()),
  /**
   * Le dépôt en cours d'un Supra qui couvre la collectivité : tant qu'il dure,
   * elle ne peut pas commencer le sien.
   */
  couvertureEnCours: z.nullable(
    z.object({
      porteur: z.object({ id: z.number(), nom: z.string() }),
      /** Date de lancement saisie, ou à défaut date de création (AAAA-MM-JJ). */
      dateDebut: z.string(),
    })
  ),
});

export type DepotContext = z.infer<typeof depotContextSchema>;
