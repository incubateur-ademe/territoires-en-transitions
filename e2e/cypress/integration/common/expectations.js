// attentes génériques
export const Expectations = {
  absent: 'not.exist',
  présent: 'exist',
  visible: 'be.visible',
  masqué: 'not.be.visible',
  contient: 'contain.text',
  'contient la valeur': 'contain.value',
  activé: 'be.enabled',
  activée: 'be.enabled',
  désactivé: 'be.disabled',
  désactivée: 'be.disabled',
  vide: 'be.empty',
  aucun: {cond: 'have.length', value: 0},
  plusieurs: {cond: 'have.length.greaterThan', value: 0},
  coché: 'be.checked',
  décoché: 'not.be.checked',
  cochée: 'be.checked',
  décochée: 'not.be.checked',
};
