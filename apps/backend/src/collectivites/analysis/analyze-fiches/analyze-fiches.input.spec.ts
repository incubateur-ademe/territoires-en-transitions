import { describe, it } from 'vitest';

describe('full-flow', () => {
  it.todo('--collectivites=12,45,78 cible les fiches de ces trois CT');
  it.todo('--collectivites=all cible les fiches de toutes les CT');
});

describe('enjeu', () => {
  it.todo("fixe l'enjeu à ges, seul enjeu analysé");
});

describe('daily-ct-check', () => {
  it.todo('sans argument, lance le passage quotidien');
});

describe('arguments', () => {
  it.todo("refuse un identifiant de CT qui n'est pas un entier positif");
  it.todo('refuse --collectivites sans valeur');
  it.todo('refuse un argument inconnu');
});
