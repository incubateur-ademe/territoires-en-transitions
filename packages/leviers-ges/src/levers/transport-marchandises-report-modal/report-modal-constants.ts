import { quantity } from '../../domain/units.ts'
import type { Fraction, KgCo2ePerTonneKilometre, TonneKilometres } from '../../domain/units.ts'

// Source : TrsptMarch_ReportModal, formes de la formule et B13 : « Les facteurs 0,8064, 1,0164, … sont issus de l'analyse du programme CEE REMOVE » ; part des t.km routières évitées par t.km reportée vers le ferroviaire, introuvable dans les documents REMOVE lus
const RAIL_SHIFT_AVOIDED_ROAD_RATIO: Fraction = quantity<'Fraction'>('0.8064')

// Source : TrsptMarch_ReportModal, formes de la formule et B13 : t.km ferroviaires créées par t.km reportée vers le ferroviaire (augmentation de distance), introuvable dans les documents REMOVE lus
const RAIL_SHIFT_ADDED_RAIL_RATIO: Fraction = quantity<'Fraction'>('1.0164')

// Source : TrsptMarch_ReportModal, formes de la formule et B13 : part des t.km routières évitées par t.km reportée vers le fluvial, introuvable dans les documents REMOVE lus
const WATERWAY_SHIFT_AVOIDED_ROAD_RATIO: Fraction = quantity<'Fraction'>('0.8176')

// Source : TrsptMarch_ReportModal, formes de la formule et B13 : t.km fluviales créées par t.km reportée vers le fluvial, introuvable dans les documents REMOVE lus
const WATERWAY_SHIFT_ADDED_WATERWAY_RATIO: Fraction = quantity<'Fraction'>('0.9576')

// Source : Base Empreinte de l'ADEME, élément 47691 « Train, motorisation moyenne, chargement moyen », France continentale : combustion 0,004715 + amont 0,002563 = 0,007278, fabrication (0,002991) exclue ; DonneesReference!D42 « avec prise en compte d'une part de l'amont »
const RAIL_FREIGHT_EMISSION_FACTOR: KgCo2ePerTonneKilometre =
  quantity<'KgCo2ePerTonneKilometre'>('0.007278')

// Source : tableur PlanET V1, FE_fluvial!D25 : moyenne des six facteurs par classe de bateau, poste Combustion seul (Base Empreinte), pondérée par le nombre de bateaux de la flotte active VNF 2016 : 0,0206283 kgCO2e par t.km
const WATERWAY_FREIGHT_EMISSION_FACTOR: KgCo2ePerTonneKilometre =
  quantity<'KgCo2ePerTonneKilometre'>('0.0206283')

// Source : ParametreDeterminants!A36 « Tonnes.km de TRM passées de la route à des modes actifs » : le tableur ne donne ni valeur par défaut ni valeur SNBC 3, zéro quand la requête n'en donne pas (choix de conception, non validé)
const DEFAULT_CYCLOLOGISTIC_TONNE_KILOMETRES: TonneKilometres = quantity<'TonneKilometres'>('0')

export {
  DEFAULT_CYCLOLOGISTIC_TONNE_KILOMETRES,
  RAIL_FREIGHT_EMISSION_FACTOR,
  RAIL_SHIFT_ADDED_RAIL_RATIO,
  RAIL_SHIFT_AVOIDED_ROAD_RATIO,
  WATERWAY_FREIGHT_EMISSION_FACTOR,
  WATERWAY_SHIFT_ADDED_WATERWAY_RATIO,
  WATERWAY_SHIFT_AVOIDED_ROAD_RATIO,
}
