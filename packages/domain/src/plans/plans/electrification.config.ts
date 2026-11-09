import * as z from 'zod/mini';
import { electrificationFichesConfigSchema } from './electrification-fiches.config';
import { indicateurPeriodiciteSchema } from '../../indicateurs/indicateur/indicateur-periodicite.schema';
import { nonBlankTextSchema } from '../../shared/non-blank-text.schema';

/** Identifiants internes stables du programme, indépendants des libellés du canevas. */
export const ElectrificationEngagementCodeEnum = {
  SORTIE_FIOUL_LOGEMENTS_PRIVES: 'E01',
  SORTIE_GAZ_LOGEMENTS_PRIVES: 'E02',
  DECOMMISSIONNEMENT_RESEAU_GAZ: 'E03',
  SORTIE_GAZ_LOGEMENTS_SOCIAUX: 'E04',
  SORTIE_GAZ_BATIMENTS_PUBLICS: 'E05',
  ELECTRIFICATION_VEHICULES_PARTICULIERS: 'E06',
  BORNES_RECHARGE_PUBLIQUES: 'E07',
  ELECTRIFICATION_AUTOBUS: 'E08',
  ELECTRIFICATION_ARTISANS: 'E09',
  ELECTRIFICATION_INDUSTRIE: 'E10',
  ELECTRIFICATION_AGRICULTURE: 'E11',
  SITE_RECHARGE_POIDS_LOURDS: 'E12',
} as const;

export const electrificationConfigSchema = z.object({
  version: nonBlankTextSchema,
  fiches: electrificationFichesConfigSchema,
  axes: z.array(
    z.object({
      numero: z.int().check(z.positive()),
      titre: z.string().check(z.minLength(1)),
    })
  ),
  // null signifie que la correspondance métier n'a pas encore été livrée.
  sousAxes: z.nullable(
    z.array(
      z.object({
        numero: z.string().check(z.minLength(1)),
        axeNumero: z.int().check(z.positive()),
        titre: z.string().check(z.minLength(1)),
      })
    )
  ),
  engagements: z.array(
    z.object({
      code: z.string().check(z.minLength(1)),
      axeNumero: z.int().check(z.positive()),
      actionTitre: z.nullable(z.string().check(z.minLength(1))),
      cibles: z.array(
        z.object({
          key: z.string().check(z.minLength(1)),
          identifiantReferentiel: z.string().check(z.minLength(1)),
          unite: z.string().check(z.minLength(1)),
          periodicite: z.nullable(indicateurPeriodiciteSchema),
          validation: z.enum(['pending', 'validated']),
        })
      ),
    })
  ),
});

export type ElectrificationConfig = z.infer<typeof electrificationConfigSchema>;

/**
 * Correspondances Électrification versionnées dans Git, à valider avec le métier.
 * Les définitions et périodicités sont vérifiées dans le catalogue TeT.
 * Les décisions et leur provenance documentaire sont conservées dans l'ADR 0022.
 */
export const electrificationConfig: ElectrificationConfig = {
  version: 'electrification-v2',
  fiches: { actions: null, indicateurs: null },
  axes: [
    { numero: 1, titre: 'Logements privés : sortie du fioul et du gaz' },
    { numero: 2, titre: 'Logements sociaux : sortie du gaz' },
    { numero: 3, titre: 'Bâtiments publics : sortie du fioul et du gaz' },
    {
      numero: 4,
      titre: 'Réseau de gaz : décommissionnement de certaines portions',
    },
    { numero: 5, titre: 'Véhicules particuliers électriques' },
    { numero: 6, titre: 'Bornes de recharge' },
    { numero: 7, titre: 'Recharge des poids lourds' },
    { numero: 8, titre: 'Autobus électriques' },
    { numero: 9, titre: 'Artisans' },
    { numero: 10, titre: 'Industrie' },
    { numero: 11, titre: 'Agriculture' },
  ],
  sousAxes: null,
  engagements: [
    {
      code: ElectrificationEngagementCodeEnum.SORTIE_FIOUL_LOGEMENTS_PRIVES,
      axeNumero: 1,
      actionTitre: null,
      cibles: [
        {
          key: 'principale',
          identifiantReferentiel: 'part_log_priv_sortie_fioul',
          unite: '%',
          periodicite: null,
          validation: 'pending',
        },
      ],
    },
    {
      code: ElectrificationEngagementCodeEnum.SORTIE_GAZ_LOGEMENTS_PRIVES,
      axeNumero: 1,
      actionTitre: null,
      cibles: [
        {
          key: 'principale',
          identifiantReferentiel: 'part_log_priv_sortie_gaz',
          unite: '%',
          periodicite: null,
          validation: 'pending',
        },
      ],
    },
    {
      code: ElectrificationEngagementCodeEnum.DECOMMISSIONNEMENT_RESEAU_GAZ,
      axeNumero: 4,
      actionTitre:
        'Travailler au décommissionnement de certaines portions du réseau de gaz',
      cibles: [],
    },
    {
      code: ElectrificationEngagementCodeEnum.SORTIE_GAZ_LOGEMENTS_SOCIAUX,
      axeNumero: 2,
      actionTitre: null,
      cibles: [
        {
          key: 'principale',
          identifiantReferentiel: 'part_log_soc_sortie_gaz',
          unite: '%',
          periodicite: null,
          validation: 'pending',
        },
      ],
    },
    {
      code: ElectrificationEngagementCodeEnum.SORTIE_GAZ_BATIMENTS_PUBLICS,
      axeNumero: 3,
      actionTitre: null,
      cibles: [
        {
          key: 'principale',
          identifiantReferentiel: 'part_bat_pub_sortie_gaz',
          unite: '%',
          periodicite: null,
          validation: 'pending',
        },
      ],
    },
    {
      code: ElectrificationEngagementCodeEnum.ELECTRIFICATION_VEHICULES_PARTICULIERS,
      axeNumero: 5,
      actionTitre: null,
      cibles: [
        {
          key: 'principale',
          identifiantReferentiel: 'v_particulier_elec',
          unite: '%',
          periodicite: null,
          validation: 'pending',
        },
      ],
    },
    {
      code: ElectrificationEngagementCodeEnum.BORNES_RECHARGE_PUBLIQUES,
      axeNumero: 6,
      actionTitre: null,
      cibles: [
        {
          key: 'total',
          identifiantReferentiel: 's_26',
          unite: 'Nombre de bornes',
          periodicite: null,
          validation: 'pending',
        },
        {
          key: 'rapides',
          identifiantReferentiel: 's_26.a',
          unite: 'Nombre de bornes',
          periodicite: null,
          validation: 'pending',
        },
      ],
    },
    {
      code: ElectrificationEngagementCodeEnum.ELECTRIFICATION_AUTOBUS,
      axeNumero: 8,
      actionTitre: null,
      cibles: [
        {
          key: 'principale',
          identifiantReferentiel: 'autobus_autocar_elec',
          unite: '%',
          periodicite: null,
          validation: 'pending',
        },
      ],
    },
    {
      code: ElectrificationEngagementCodeEnum.ELECTRIFICATION_ARTISANS,
      axeNumero: 9,
      actionTitre: null,
      cibles: [
        {
          key: 'principale',
          identifiantReferentiel: 'nb_artisan_elec',
          unite: 'Nombre',
          periodicite: null,
          validation: 'pending',
        },
      ],
    },
    {
      code: ElectrificationEngagementCodeEnum.ELECTRIFICATION_INDUSTRIE,
      axeNumero: 10,
      actionTitre: null,
      cibles: [
        {
          key: 'principale',
          identifiantReferentiel: 'conso_elec_projet_ind',
          unite: 'MWh',
          periodicite: null,
          validation: 'pending',
        },
      ],
    },
    {
      code: ElectrificationEngagementCodeEnum.ELECTRIFICATION_AGRICULTURE,
      axeNumero: 11,
      actionTitre: null,
      cibles: [
        {
          key: 'principale',
          identifiantReferentiel: 'conso_elec_projet_agri',
          unite: 'MWh',
          periodicite: null,
          validation: 'pending',
        },
      ],
    },
    {
      code: ElectrificationEngagementCodeEnum.SITE_RECHARGE_POIDS_LOURDS,
      axeNumero: 7,
      actionTitre:
        "Identifier un site clés en main pour l'installation de stations de recharge de poids lourds électriques",
      cibles: [],
    },
  ],
};
