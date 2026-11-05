import * as z from 'zod/mini';
import { indicateurPeriodiciteSchema } from '../../indicateurs/indicateur/indicateur-periodicite.schema';
import { nonBlankTextSchema } from '../../shared/non-blank-text.schema';

export const electrificationEngagementsConfigSchema = z.object({
  version: nonBlankTextSchema,
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

export type ElectrificationEngagementsConfig = z.infer<
  typeof electrificationEngagementsConfigSchema
>;

/**
 * Correspondances Électrification versionnées dans Git, à valider avec le métier.
 * Les définitions et périodicités sont vérifiées dans le catalogue TeT.
 * Les décisions et leur provenance documentaire sont conservées dans l'ADR 0022.
 */
export const electrificationEngagementsConfig: ElectrificationEngagementsConfig =
  {
    version: 'electrification-engagements-v1',
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
        code: 'E01',
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
        code: 'E02',
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
        code: 'E03',
        axeNumero: 4,
        actionTitre:
          'Travailler au décommissionnement de certaines portions du réseau de gaz',
        cibles: [],
      },
      {
        code: 'E04',
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
        code: 'E05',
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
        code: 'E06',
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
        code: 'E07',
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
        code: 'E08',
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
        code: 'E09',
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
        code: 'E10',
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
        code: 'E11',
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
        code: 'E12',
        axeNumero: 7,
        actionTitre:
          "Identifier un site clés en main pour l'installation de stations de recharge de poids lourds électriques",
        cibles: [],
      },
    ],
  };
