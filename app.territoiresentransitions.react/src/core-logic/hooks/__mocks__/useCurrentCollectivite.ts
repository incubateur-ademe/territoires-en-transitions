// mock à ajouter dans ./storybook/main.js (webpackFinal)
export const useCurrentCollectivite = () => {
  return {
    collectivite_id: 1,
    nom: 'Amberieu-en-Bugey',
    niveau_acces: 'referent',
    isReferent: true,
    readonly: false,
  };
};
