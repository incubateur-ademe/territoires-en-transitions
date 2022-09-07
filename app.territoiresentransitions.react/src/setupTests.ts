// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// chargement des mocks pour le bon fonctionnement du snapshot testing (storyshots)
// ATTENTION : il faut aussi charger les mocks dans .storybook/main.js pour
// qu'ils soient disponibles pour l'affichage des stories dans le storybook
jest.mock('core-logic/hooks/useCurrentCollectivite.ts');

// ce mock n'est importé qu'ici car la version d'origine fonctionne dans le navigateur
jest.mock('utils/shasum256.ts');
