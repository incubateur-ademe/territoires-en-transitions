import * as z from 'zod/mini';
import { nonBlankTextSchema } from '../../shared/non-blank-text.schema';

export const electrificationLaureatsConfigSchema = z.object({
  source: nonBlankTextSchema,
  version: nonBlankTextSchema,
  validFrom: z.iso.datetime(),
  validUntil: z.nullable(z.iso.datetime()),
  laureats: z.array(
    z.object({
      reference: nonBlankTextSchema,
      collectiviteId: z.int().check(z.positive()),
    })
  ),
});

export type ElectrificationLaureatsConfig = z.infer<
  typeof electrificationLaureatsConfigSchema
>;

/**
 * Liste provisoire du 30 septembre, rapprochée des collectivités TeT.
 * Les porteurs de groupements sont repris provisoirement du fichier source.
 * Les corrections et les quatre exclusions sont documentées dans l'ADR 0022.
 * null indique un mapping non livré ; validUntil null le conserve jusqu'à remplacement.
 */
export const electrificationLaureatsConfig: ElectrificationLaureatsConfig | null =
  {
    source: '20260930_Territoires_electrification_activite_TET.xlsx',
    version: '2026-09-30-revision-2026-11-11',
    validFrom: '2026-09-30T00:00:00.000Z',
    validUntil: null,
    laureats: [
      // CC du Pays Houdanais (CCPH)
      { reference: '247800550', collectiviteId: 5182 },
      // CC Haut Limousin en Marche
      { reference: '200071942', collectiviteId: 5321 },
      // Ville et Eurométropole de Strasbourg
      { reference: '246700488', collectiviteId: 4935 },
      // CA d'Epinal
      { reference: '200068757', collectiviteId: 5330 },
      // CA du Centre Littoral
      { reference: '249730045', collectiviteId: 5421 },
      // CA du Pays Basque
      { reference: '200067106', collectiviteId: 4897 },
      // CC de Saint-Flour
      { reference: '200066660', collectiviteId: 4004 },
      // Assemblée du Pays Tarentaise Vanoise (APTV) — porteur provisoire : Assemblée du Pays Tarentaise Vanoise (APTV)
      { reference: 'grp-868d83ef30a1', collectiviteId: 5473 },
      // Ardenne Métropole
      { reference: '200041630', collectiviteId: 3913 },
      // CA Saint-Lô Agglo
      { reference: '200066389', collectiviteId: 4646 },
      // Métropole de Lyon
      { reference: '200046977', collectiviteId: 4999 },
      // CC Coeur de Savoie
      { reference: '200041010', collectiviteId: 5078 },
      // CA du Grand Annecy
      { reference: '200066793', collectiviteId: 5093 },
      // CC Cap Sizun - Pointe du Raz
      { reference: '242900629', collectiviteId: 4221 },
      // CC de l'Ile d'Oléron
      { reference: '241700624', collectiviteId: 4035 },
      // CC Creuse Grand Sud
      { reference: '200044014', collectiviteId: 4110 },
      // CA du Libournais
      { reference: '200070092', collectiviteId: 4323 },
      // CA du Bassin de Bourg-en-Bresse
      { reference: '200071751', collectiviteId: 3811 },
      // CA Vichy Communauté
      { reference: '200071363', collectiviteId: 3852 },
      // CC du Rhône aux Gorges de l'Ardèche
      { reference: '240700864', collectiviteId: 3909 },
      // CC du Royans-Vercors
      { reference: '200067767', collectiviteId: 4170 },
      // Grenoble-Alpes-Métropole
      { reference: '200040715', collectiviteId: 4434 },
      // CC Charlieu-Belmont
      { reference: '200035202', collectiviteId: 4519 },
      // CA du Puy-en-Velay
      { reference: '200073419', collectiviteId: 4528 },
      // CC des Pays de Cayres et de Pradelles
      { reference: '244301123', collectiviteId: 4537 },
      // CA Riom Limagne et Volcans
      { reference: '200070753', collectiviteId: 4879 },
      // CC Saône-Beaujolais
      { reference: '200067817', collectiviteId: 4992 },
      // CA Grand Lac
      { reference: '200068674', collectiviteId: 5073 },
      // CC des Terres d'Auxois
      { reference: '200071017', collectiviteId: 4080 },
      // CC de Montbenoit
      { reference: '242500320', collectiviteId: 4151 },
      // CA de Nevers
      { reference: '245804406', collectiviteId: 4770 },
      // Luxeuil-les-Bains
      { reference: '70311', collectiviteId: 2680 },
      // CA Le Grand Chalon
      { reference: '247100589', collectiviteId: 5026 },
      // CC Entre Arroux, Loire et Somme
      { reference: '200070316', collectiviteId: 5031 },
      // CC du Jovinien
      { reference: '248900938', collectiviteId: 5359 },
      // CA Grand Belfort
      { reference: '200069052', collectiviteId: 5360 },
      // CA Saint-Brieuc Armor Agglomération
      { reference: '200069409', collectiviteId: 4100 },
      // CC Pays de Châteaugiron Communauté
      { reference: '243500659', collectiviteId: 4391 },
      // CC Pontivy Communauté
      { reference: '245614433', collectiviteId: 4741 },
      // CA Bourges Plus
      { reference: '241800507', collectiviteId: 4040 },
      // CC Coeur de Beauce
      { reference: '200070159', collectiviteId: 4200 },
      // CC du Perche et Haut Vendômois
      { reference: '200040772', collectiviteId: 4504 },
      // CC du Pithiverais-Gâtinais
      { reference: '200071850', collectiviteId: 4572 },
      // CC de la Région de Suippes
      { reference: '200042620', collectiviteId: 4660 },
      // CA de Saint-Dizier Der et Blaise
      { reference: '200068666', collectiviteId: 4673 },
      // Métropole du Grand Nancy
      { reference: '245400676', collectiviteId: 4692 },
      // CA du Grand Verdun
      { reference: '200049187', collectiviteId: 4714 },
      // Metz Métropole
      { reference: '200039865', collectiviteId: 4744 },
      // Saint-Quentin
      { reference: '02691', collectiviteId: 59 },
      // CC de la Plaine d'Estrées
      { reference: '246000897', collectiviteId: 4827 },
      // CC des 7 Vallées
      { reference: '200044030', collectiviteId: 4861 },
      // CA Marne et Gondoire
      { reference: '247700594', collectiviteId: 5149 },
      // CC le Dourdannais en Hurepoix (CCDH)
      { reference: '249100595', collectiviteId: 5374 },
      // Suresnes
      { reference: '92073', collectiviteId: 3561 },
      // Saint-Maur-des-Fossés
      { reference: '94068', collectiviteId: 3639 },
      // CC Vexin Centre
      { reference: '200035970', collectiviteId: 5397 },
      // CA Lisieux Normandie
      { reference: '200069532', collectiviteId: 3984 },
      // CA Seine Normandie Agglomération
      { reference: '200072312', collectiviteId: 4179 },
      // CC du Pays de Conches
      { reference: '242700276', collectiviteId: 4188 },
      // CC Communauté Bray-Eawy
      { reference: '200070068', collectiviteId: 5128 },
      // CC des 4B Sud Charente
      { reference: '200029734', collectiviteId: 4017 },
      // Bordeaux Métropole
      { reference: '243300316', collectiviteId: 4322 },
      // CC Maremne Adour Côte Sud
      { reference: '244000865', collectiviteId: 4492 },
      // CA d'Agen
      { reference: '200096956', collectiviteId: 4601 },
      // CC Vienne et Gartempe
      { reference: '200070043', collectiviteId: 5312 },
      // CA Pays Foix-Varilhes
      { reference: '200067791', collectiviteId: 3924 },
      // Territoire d'énergie GARD SMEG — porteur provisoire : Territoire d'énergie GARD SMEG
      { reference: 'grp-336e7cba4c4e', collectiviteId: 8212 },
      // CC du Frontonnais
      { reference: '200034957', collectiviteId: 4279 },
      // Syndicat de développement local du Pays Coeur d'Hérault ou ''SYDEL du Pays Coeur d'Hérault'' — porteur provisoire : Syndicat de développement local du Pays Coeur d'Hérault ou ''SYDEL du Pays Coeur d'Hérault''
      { reference: 'grp-762cb9b64046', collectiviteId: 4377 },
      // CC Grand-Figeac
      { reference: '200067361', collectiviteId: 4591 },
      // CC Tarn-Agout
      { reference: '200034023', collectiviteId: 5223 },
      // Nègrepelisse
      { reference: '82134', collectiviteId: 3177 },
      // CA de la Région Nazairienne et de l'Estuaire (CARENE)
      { reference: '244400644', collectiviteId: 4549 },
      // CA Cholet Agglomération
      { reference: '200071678', collectiviteId: 4631 },
      // Laval Agglomération
      { reference: '200083392', collectiviteId: 4683 },
      // PETR Pays vallée du Loir — porteur provisoire : PETR Pays vallée du Loir
      { reference: 'grp-970d2af4d888', collectiviteId: 5072 },
      // CC du Pays de Fontenay-Vendée
      { reference: '200071934', collectiviteId: 5292 },
      // CC Serre-Ponçon Val d'Avance
      { reference: '200067320', collectiviteId: 3875 },
      // CA Cannes Pays de Lérins
      { reference: '200039915', collectiviteId: 3885 },
      // CA Terre de Provence
      { reference: '200035087', collectiviteId: 3980 },
      // CC Lacs et Gorges du Verdon
      { reference: '200040210', collectiviteId: 5260 },
      // SCot du Bassin d'Aurillac, du Carladès et de la Chataîgneraie — porteur provisoire : SM du SCOT du bassin d'Aurillac, du Carladès et de la Châtaigneraie
      { reference: 'grp-56a090848030', collectiviteId: 4011 },
      // Pays de Vesoul – Val de Saône — porteur provisoire : SM du Pays Vesoul Val de Saône
      { reference: 'grp-bdceb32faada', collectiviteId: 6001 },
      // Projet collectif Îles du Ponant (Association des îles du Ponant) — porteur provisoire : CC de Belle Ile en Mer
      { reference: 'grp-80847299b600', collectiviteId: 4738 },
      // Syndicat Départemental d'Énergies de l'Indre (SDEI) — porteur provisoire : Syndicat départemental d'énergies de l'Indre
      { reference: 'grp-76428f119feb', collectiviteId: 8767 },
      // Syndicat Intercommunal d’énergie d’Indre-et-Loire — porteur provisoire : SI d'énergie d'Indre-et-Loire
      { reference: 'grp-94cc849e7d0f', collectiviteId: 8870 },
      // Syndicat Mixte du Pays de la vallée du cher et du Romorantinais — porteur provisoire : SM du Pays de la vallée du Cher et du Romorantinais
      { reference: 'grp-3296adf2cefb', collectiviteId: 9348 },
      // Corse — porteur provisoire : CA du Pays Ajaccien
      { reference: 'grp-9bc9d9afca22', collectiviteId: 4232 },
      // Groupement (CC vallée de villé, CC Vallée de la Bruche, CC Val d'Argent) — porteur provisoire : CC de la Vallée de Villé
      { reference: 'grp-680f17f4cbb1', collectiviteId: 4951 },
      // TE Flandre — porteur provisoire : Territoire d'énergie Flandre
      { reference: 'grp-d27eb011b0fd', collectiviteId: 10510 },
      // CU Arras et CC voisines — porteur provisoire : CU d'Arras
      { reference: 'grp-bdf80b5e607e', collectiviteId: 4851 },
      // PÔLE METROPOLITAIN DU GRAND AMIENOIS — porteur provisoire : Pôle Métropolitain du Grand Amiénois
      { reference: 'grp-2746cb7c839d', collectiviteId: 5219 },
      // EPT Est Ensemble — porteur provisoire : Est Ensemble
      { reference: 'grp-99f1daccbe14', collectiviteId: 5386 },
      // SIDELEC – Syndicat Intercommunal d'Électricité du Département de La Réunion — porteur provisoire : SIDELEC
      { reference: 'grp-68f90ca1d783', collectiviteId: 13679 },
      // SMEM Syndicat Mixte d’Energie de Martinique — porteur provisoire : SM d'électricité de la Martinique
      { reference: 'grp-68c410523947', collectiviteId: 13671 },
      // CC Haute-Corrèze-Communauté / CC Vézère-Monédières-Millesources / Syndicat de la Diège — porteur provisoire : CC Haute-Corrèze Communauté
      { reference: 'grp-8f3ce7c5f878', collectiviteId: 4063 },
      // CC Carcassonne agglo et Grand Narbonne Agglo — porteur provisoire : CA Carcassonne Agglo
      { reference: 'grp-213af2a3e232', collectiviteId: 3948 },
      // SIEDA (CC Millau Grands Causses + Decazeville Communauté + Rodez agglomération) — porteur provisoire : SI d'énergies du département de l'Aveyron (SIEDA)
      { reference: 'grp-f3781e3079b5', collectiviteId: 6814 },
      // Pays Portes de Gascogne — porteur provisoire : PETR Pays Portes de Gascogne
      { reference: 'grp-61288d13ec67', collectiviteId: 5449 },
      // PETR du Pays du Gévaudan — porteur provisoire : PETR du Pays du Gévaudan Lozère
      { reference: 'grp-f5995b438318', collectiviteId: 9703 },
      // CC Neste Barousse + CC Pays de Trie et du Magnoac — porteur provisoire : CC Neste Barousse
      { reference: 'grp-0098312ed9ca', collectiviteId: 4913 },
      // CC Pyrénées Catalanes + CC Pyrénées Cerdagne + CC Conflent Canigo — porteur provisoire : CC Pyrénées Catalanes
      { reference: 'grp-97a62eba7106', collectiviteId: 4930 },
      // Syndicat d'énergie des ALPES-DE-HAUTE-PROVENCE — porteur provisoire : Syndicat d'énergie des Alpes-de-Haute-Provence
      { reference: 'grp-b4e72274f4e4', collectiviteId: 6365 },
      // PETR du Briançonnais, du Pays des Ecrins, du Guillestrois et du Queyras — porteur provisoire : PETR Briançonnais, Ecrins, Guillestrois, Queyras
      { reference: 'grp-08897031d9a1', collectiviteId: 5490 },
      // Syndicat d'Énergie Vauclusien (SEV) SIREN 200035913 — porteur provisoire : Syndicat d'énergie Vauclusien
      { reference: 'grp-973e6fce8957', collectiviteId: 13137 },
    ],
  };
