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
  version: 'electrification-v1',
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
  sousAxes: [
    {
      numero: '1.1',
      axeNumero: 1,
      titre:
        'Connaître et cibler les logements privés chauffés au fioul et au gaz',
    },
    {
      numero: '1.2',
      axeNumero: 1,
      titre:
        'Aller au-devant des ménages et les orienter vers la pompe à chaleur ou les réseaux de chaleur',
    },
    {
      numero: '1.3',
      axeNumero: 1,
      titre: 'Lever les freins techniques au changement de chauffage',
    },
    {
      numero: '1.4',
      axeNumero: 1,
      titre: 'Mobiliser les professionnels et saisir les moments clés',
    },
    {
      numero: '1.5',
      axeNumero: 1,
      titre: 'Développer les réseaux de chaleur et y raccorder les bâtiments',
    },
    {
      numero: '2.1',
      axeNumero: 2,
      titre: "Établir l'état des lieux et prioriser",
    },
    {
      numero: '2.2',
      axeNumero: 2,
      titre: 'Construire et accompagner les trajectoires avec les bailleurs',
    },
    {
      numero: '2.3',
      axeNumero: 2,
      titre: "Assurer le suivi et l'essaimage des résultats",
    },
    {
      numero: '3.1',
      axeNumero: 3,
      titre:
        'Connaître et planifier la sortie du fioul et du gaz du patrimoine public',
    },
    {
      numero: '3.2',
      axeNumero: 3,
      titre: 'Financer et conduire les opérations',
    },
    {
      numero: '3.3',
      axeNumero: 3,
      titre: 'Faire des bâtiments publics des exemples',
    },
    {
      numero: '4.1',
      axeNumero: 4,
      titre: 'Connaître les usages actuels du gaz et le réseau existant',
    },
    {
      numero: '4.2',
      axeNumero: 4,
      titre: "Élaborer des scénarios locaux d'évolution des usages du gaz",
    },
    {
      numero: '4.3',
      axeNumero: 4,
      titre: 'Décider des zones concernées et des réinvestissements à éviter',
    },
    {
      numero: '4.4',
      axeNumero: 4,
      titre:
        "Accompagner les usagers et préparer l'évolution du réseau dans les zones retenues",
    },
    {
      numero: '5.1',
      axeNumero: 5,
      titre:
        'Établir un diagnostic du parc local de véhicules à partir des données existantes',
    },
    {
      numero: '5.2',
      axeNumero: 5,
      titre: "Informer, inciter et rendre attractif le passage à l'électrique",
    },
    {
      numero: '5.3',
      axeNumero: 5,
      titre:
        "Accompagner les particuliers dans la location ou l'achat d'un véhicule électrique",
    },
    {
      numero: '5.4',
      axeNumero: 5,
      titre:
        'Électrifier la flotte de la collectivité et des établissements publics',
    },
    {
      numero: '5.5',
      axeNumero: 5,
      titre: 'Électrifier les flottes des employeurs du territoire',
    },
    {
      numero: '6.1',
      axeNumero: 6,
      titre: 'Planifier le réseau de recharge',
    },
    {
      numero: '6.2',
      axeNumero: 6,
      titre: "Développer l'itinérance rapide",
    },
    {
      numero: '6.3',
      axeNumero: 6,
      titre: 'Assurer une couverture complète',
    },
    {
      numero: '7.1',
      axeNumero: 7,
      titre: 'Établir le besoin actuel et à venir',
    },
    {
      numero: '7.2',
      axeNumero: 7,
      titre:
        "Analyser les potentiels fonciers et définir le(s) site(s) d'accueil",
    },
    {
      numero: '7.3',
      axeNumero: 7,
      titre: "Assurer l'attractivité des stations de recharge",
    },
    {
      numero: '8.1',
      axeNumero: 8,
      titre: "Établir l'état des lieux",
    },
    {
      numero: '8.2',
      axeNumero: 8,
      titre: "Établir une stratégie pluriannuelle d'électrification",
    },
    {
      numero: '8.3',
      axeNumero: 8,
      titre: 'Adapter le service et les infrastructures',
    },
    {
      numero: '9.1',
      axeNumero: 9,
      titre: "Établir l'état des lieux",
    },
    {
      numero: '9.2',
      axeNumero: 9,
      titre: "Faciliter l'accès des artisans aux équipements électriques",
    },
    {
      numero: '9.3',
      axeNumero: 9,
      titre: 'Anticiper les besoins électriques des zones artisanales',
    },
    {
      numero: '9.4',
      axeNumero: 9,
      titre:
        "Mettre en place un environnement favorable à l'électrification des artisans",
    },
    {
      numero: '9.5',
      axeNumero: 9,
      titre: "Électrifier le chauffage des locaux d'activité",
    },
    {
      numero: '9.6',
      axeNumero: 9,
      titre: 'Électrifier les véhicules utilitaires des artisans',
    },
    {
      numero: '10.1',
      axeNumero: 10,
      titre: "Établir l'état des lieux",
    },
    {
      numero: '10.2',
      axeNumero: 10,
      titre:
        "Faciliter et suivre l'accès des sites industriels aux équipements électriques",
    },
    {
      numero: '10.3',
      axeNumero: 10,
      titre: "Favoriser la mutualisation dans les zones d'activités",
    },
    {
      numero: '11.1',
      axeNumero: 11,
      titre: "Établir l'état des lieux",
    },
    {
      numero: '11.2',
      axeNumero: 11,
      titre:
        'Orienter les agriculteurs vers les solutions électriques adaptées à chaque usage',
    },
    {
      numero: '11.3',
      axeNumero: 11,
      titre: "Accompagner l'électrification des engins agricoles",
    },
  ],
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
          periodicite: 'annuelle',
          validation: 'validated',
        },
        {
          key: 'rapides',
          identifiantReferentiel: 's_26.a',
          unite: 'Nombre de bornes',
          periodicite: 'annuelle',
          validation: 'validated',
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
