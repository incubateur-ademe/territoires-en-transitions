// version simulée pour faire tourner les storyshots car la version d'origine
// utilisent des api non dispo dans l'environnement de test (jest/nodejs)
export const shasum256 = async (): Promise<string> =>
  Promise.resolve('fake-shasum');
