/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}', './public/index.html'],
  safelist: ['ml-0', 'ml-20', 'ml-40', 'ml-60'],
  theme: {
    maxHeight: {
      '80vh': '80vh',
    },
    extend: {
      colors: {
        // Misc
        beige: '#f9f8f6',
        // Design system
        bf500: '#000091',
        bf525: '#6A6AF4',
        // En rapport avec la dernière version Figma du DSFR
        // nomenclature Figma: light/text/default-info
        // nomenclature tailwind proposée: t = text -> tDefaultInfo
        bf925: '#E3E3FD',
        bf925hover: '#C1C1FB',
        bf975: '#f5f5fe',
        grey425: '#666',
        grey625: '#929292',
        grey925: '#E5E5E5',
        grey975: '#F6F6F6',
        // Couleurs système (info, succès, erreur)
        tDefaultInfo: '#0063CB',
        success: '#18753C',
        error425: '#CE0500',
        principale: '#6A6AF4',
        'principale-1': '#F4F5FD',
        'principale-2': '#F0F0FE',
        'principale-3': '#E1E1FD',
        'principale-4': '#C3C3FB',
        'principale-5': '#A5A5F8',
        'principale-6': '#8888F6',
        'principale-7': '#6A6AF4',
        'principale-8': '#5555C3',
        'principale-9': '#404092',
        'error-1': '#F55B5B',
        'error-2': '#FFD8D8',
        'error-3': '#FF9789',
        'warning-1': '#FFA903',
        'warning-2': '#FFF5DF',
        'warning-3': '#FBC55C',
        'info-1': '#4380F5',
        'info-2': '#EEF4FF',
        'info-3': '#91B2EE',
        'success-1': '#48A775',
        'success-2': '#E4FCEF',
        'success-3': '#3AD483',
        'grey-1': '#FDFDFD',
        'grey-2': '#F9F9F9',
        'grey-3': '#EEEEEE',
        'grey-4': '#DDDDDD',
        'grey-5': '#CECECE',
        'grey-6': '#929292',
        'grey-7': '#666666',
        'grey-8': '#161616',
      },
    },
  },
};
