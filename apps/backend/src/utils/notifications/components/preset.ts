/**
 * Duplique la palette de @/ui/tailwind-preset pour éviter une dépendance
 * circulaire (ui -> api -> @/domain -> backend -> ui).
 *
 * Idéalement il faudrait :
 * - éliminer la dépendance entre @/ui et @/api pour pouvoir importer le
 *   tailwind-preset depuis le backend
 * - OU déplacer le tailwind-preset dans un package séparé (permettrait de
 *   simplifier son import et d'éviter l'exception `allow:
 *   ['../../packages/ui/src/tailwind-preset']` dans la config eslint)
 */

export const preset = {
  theme: {
    extend: {
      colors: {
        // Déclinaisons couleur principale
        primary: {
          0: '#FBFCFE',
          1: '#F4F5FD',
          2: '#F0F0FE',
          3: '#E1E1FD',
          4: '#C3C3FB',
          5: '#A5A5F8',
          6: '#8888F6',
          DEFAULT: '#6A6AF4', // couleur principale
          7: '#6A6AF4',
          8: '#5555C3',
          9: '#404092',
          10: '#2A2A62',
          11: '#151531',
        },
        // Couleurs secondaires
        secondary: {
          1: '#F4C447',
          2: '#FFE4A8',
        },
        // Couleurs new
        new: {
          1: '#B88729',
          2: '#FFE8BD',
        },
        // Couleurs success
        success: {
          DEFAULT: '#48A775',
          1: '#48A775',
          2: '#E4FCEF',
          3: '#3AD483',
        },
        // Couleurs error
        error: {
          1: '#F55B5B',
          2: '#FFD8D8',
          3: '#FF9789',
        },
        // Couleurs warning
        warning: {
          1: '#FFA903',
          2: '#FFF5DF',
          3: '#FBC55C',
        },
        // Couleurs info
        info: {
          1: '#4380F5',
          2: '#EEF4FF',
          3: '#91B2EE',
        },
        // Gris
        grey: {
          1: '#FDFDFD',
          2: '#F9F9F9',
          3: '#EEEEEE',
          4: '#DDDDDD',
          5: '#CECECE',
          6: '#929292',
          7: '#8A8A8A',
          8: '#666666',
          9: '#535252',
          10: '#161616',
        },
        // Autres couleurs
        'orange-1': '#F28E40',
      },
    },
  },
};
