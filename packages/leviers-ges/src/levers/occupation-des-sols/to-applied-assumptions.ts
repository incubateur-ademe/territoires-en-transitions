import type {
  AppliedAssumption,
  AppliedAssumptions,
} from '../../application/estimate/estimate-result.ts'
import type { Level } from '../../domain/territory.ts'

// Source : choix de conception de ce dépôt, non validé : la documentation fonctionnelle (p. 74) parle de la « zone pédoclimatique majoritaire du territoire » sans dire comment agréger, et ALDO ne publie pas de facteurs par zone
const TERRITORY_FACTORS_ASSUMPTION: AppliedAssumption = {
  value:
    'les facteurs de conversion sont la moyenne des facteurs des communes, pondérée par la surface du type de sol de départ (chaque type de prairie, culture, sol artificialisé imperméabilisé)',
  source:
    'Documentation fonctionnelle (p. 74) : la zone pédoclimatique du territoire est prise en compte, une seule zone majoritaire ; ALDO Flux 2 ne publie des facteurs que par EPCI et par commune',
  limit:
    'Choix de conception, non validé : les facteurs ALDO varient au sein d’une zone pédoclimatique et plus le territoire est grand, plus une valeur unique est grossière (documentation, p. 75) ; un territoire sans le type de sol de départ prend la moyenne simple de ses communes',
}

function toAppliedAssumptions(level: Level): AppliedAssumptions {
  return {
    ...(level === 'epci' ? {} : { territoryFactors: TERRITORY_FACTORS_ASSUMPTION }),
    grasslandTypes: {
      value: 'prairies arborées, herbacées et arbustives, pondérées par leur surface',
      source:
        'ALDO distingue trois types de prairie là où la documentation fonctionnelle (p. 74) n’en nomme qu’un, la prairie ; PlanET V1, COS!B15 : choix faits au prorata des surfaces existantes',
      limit:
        'Choix de conception, non validé : le boisement et l’aménagement de zones humides sont répartis sur tous les types de prairie au prorata de la surface. Les surfaces artificialisées enherbées sont lues comme les surfaces artificialisées arbustives d’ALDO',
    },
    zeroReferenceArea: {
      value: 'un terme dont la surface de référence est nulle ne stocke rien',
      source:
        'Choix de conception, non validé : le tableur ne dit pas quoi faire quand un EPCI n’a ni prairie, ni forêt, ni prairie et culture, ni surfaces artificialisées arborées et enherbées',
      limit:
        'Un EPCI sans forêt ou sans prairie obtient 0 du terme de boisement, sans prairie et culture 0 du terme de zones humides, sans surfaces artificialisées arborées et enherbées 0 du terme de désimperméabilisation, quel que soit le taux demandé',
    },
    desealingWithoutHorizon: {
      value: 'le terme de désimperméabilisation n’est pas multiplié par l’horizon de temps',
      source:
        'Documentation fonctionnelle, équation 27 (p. 74) : le facteur de conversion de désimperméabilisation est en tCO2e par hectare, les deux autres en tCO2e par hectare et par an ; réponse du CGDD, question 2',
      limit:
        'ALDO Flux 2 donne une valeur par conversion pour les trois termes ; le tableur la lit comme un flux annuel pour le boisement et les zones humides et comme un changement ponctuel pour la désimperméabilisation',
    },
  }
}

export { toAppliedAssumptions }
