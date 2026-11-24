// Source : Base Carbone de l'ADEME, documentation « Agriculture - cheptels » (OMINEA 2013) : les onze types d'animaux de la documentation, correspondance avec le recensement agricole 2020 à décliner (choix de conception, non validé)
const ANIMAL_TYPES = [
  'dairyCows',
  'otherCattle',
  'sows',
  'otherPigs',
  'goats',
  'sheep',
  'horses',
  'mulesAndDonkeys',
  'layingHens',
  'broilers',
  'otherPoultry',
] as const

type AnimalType = (typeof ANIMAL_TYPES)[number]

export { ANIMAL_TYPES }
export type { AnimalType }
