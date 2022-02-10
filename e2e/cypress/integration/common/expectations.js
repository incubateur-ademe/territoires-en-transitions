// attentes génériques
export const Expectations = {
  absent: 'not.exist',
  présent: 'exist',
  visible: 'be.visible',
  contient: 'contain.text',
  activé: 'be.enabled',
  activée: 'be.enabled',
  désactivé: 'be.disabled',
  désactivée: 'be.disabled',
  aucun: { cond: 'have.length', value: 0 },
  plusieurs: { cond: 'have.length.greaterThan', value: 0 },
};
