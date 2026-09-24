import { describe, expect, it } from 'vitest';
import { upsertPertinence } from './upsert-pertinence';

describe('upsertPertinence', () => {
  it("ajoute la pertinence d'un levier encore non qualifié", () => {
    expect(
      upsertPertinence({
        pertinences: [{ levierId: 'biogaz', pertinence: 'pertinent' }],
        pertinence: { levierId: 'covoiturage', pertinence: 'a_discuter' },
      })
    ).toEqual([
      { levierId: 'biogaz', pertinence: 'pertinent' },
      { levierId: 'covoiturage', pertinence: 'a_discuter' },
    ]);
  });

  it('efface la pertinence des catégories du levier qui devient non pertinent', () => {
    expect(
      upsertPertinence({
        pertinences: [
          { levierId: 'biogaz', pertinence: 'pertinent' },
          {
            levierId: 'biogaz',
            categorie: 'financement',
            pertinence: 'a_discuter',
          },
          {
            levierId: 'biogaz',
            categorie: 'sensibilisation',
            pertinence: 'pertinent',
          },
          {
            levierId: 'covoiturage',
            categorie: 'financement',
            pertinence: 'pertinent',
          },
        ],
        pertinence: { levierId: 'biogaz', pertinence: 'non_pertinent' },
      })
    ).toEqual([
      {
        levierId: 'covoiturage',
        categorie: 'financement',
        pertinence: 'pertinent',
      },
      { levierId: 'biogaz', pertinence: 'non_pertinent' },
    ]);
  });

  it("garde la pertinence des catégories d'un levier qui devient pertinent", () => {
    expect(
      upsertPertinence({
        pertinences: [
          { levierId: 'biogaz', pertinence: 'non_pertinent' },
          {
            levierId: 'biogaz',
            categorie: 'financement',
            pertinence: 'a_discuter',
          },
        ],
        pertinence: { levierId: 'biogaz', pertinence: 'pertinent' },
      })
    ).toEqual([
      {
        levierId: 'biogaz',
        categorie: 'financement',
        pertinence: 'a_discuter',
      },
      { levierId: 'biogaz', pertinence: 'pertinent' },
    ]);
  });

  it("remplace la pertinence d'une catégorie sans toucher celle du levier", () => {
    expect(
      upsertPertinence({
        pertinences: [
          { levierId: 'biogaz', pertinence: 'pertinent' },
          {
            levierId: 'biogaz',
            categorie: 'financement',
            pertinence: 'a_discuter',
          },
        ],
        pertinence: {
          levierId: 'biogaz',
          categorie: 'financement',
          pertinence: 'non_pertinent',
        },
      })
    ).toEqual([
      { levierId: 'biogaz', pertinence: 'pertinent' },
      {
        levierId: 'biogaz',
        categorie: 'financement',
        pertinence: 'non_pertinent',
      },
    ]);
  });
});
