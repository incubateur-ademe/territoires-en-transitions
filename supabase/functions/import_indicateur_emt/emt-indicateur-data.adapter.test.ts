import type { EmtIndicateurDefinition } from './annual-indicateur-period.adapter.ts';
import { EmtIndicateurData } from './emt-indicateur-data.adapter.ts';

const definition = (
  id: number,
  identifiantReferentiel: string,
  unite = 'kWh'
): EmtIndicateurDefinition => ({
  id,
  identifiant_referentiel: identifiantReferentiel,
  periodicite: 'annuelle',
  unite,
});

const assert = (condition: unknown, message: string): void => {
  if (!condition) {
    throw new Error(message);
  }
};

Deno.test('resolves the historical EMT indicator identifier variants', () => {
  const domDefinition = definition(1, 'cae_15.a_dom');
  const mergedCellDefinition = definition(2, 'cae_49.d-hab');
  const horsDomDefinition = definition(3, 'cae_19.b_hors_dom');
  const perCapitaDefinition = definition(4, 'cae_49.a-hab');
  const mergedCyclableDefinition = definition(5, 'cae_49.f-hab');
  const definitionsByIdentifiant = new Map([
    [domDefinition.identifiant_referentiel!, domDefinition],
    [mergedCellDefinition.identifiant_referentiel!, mergedCellDefinition],
    [horsDomDefinition.identifiant_referentiel!, horsDomDefinition],
    [perCapitaDefinition.identifiant_referentiel!, perCapitaDefinition],
    [
      mergedCyclableDefinition.identifiant_referentiel!,
      mergedCyclableDefinition,
    ],
  ]);

  assert(
    EmtIndicateurData.resolveDefinition({
      rawId: '15a',
      rawName: 'Indicateur DOM',
      referentiel: 'cae',
      definitionsByIdentifiant,
    }) === domDefinition,
    'the DOM suffix should be preserved'
  );
  assert(
    EmtIndicateurData.resolveDefinition({
      rawId: null,
      rawName:
        'Montant des aides financières accordées aux particuliers et acteurs privés (euros/hab.an)',
      referentiel: 'cae',
      definitionsByIdentifiant,
    }) === mergedCellDefinition,
    'the known merged-cell identifier should be restored'
  );
  assert(
    EmtIndicateurData.resolveDefinition({
      rawId: '19b',
      rawName: 'Indicateur hors DOM',
      referentiel: 'cae',
      definitionsByIdentifiant,
    }) === horsDomDefinition,
    'the hors-DOM suffix should be restored'
  );
  assert(
    EmtIndicateurData.resolveDefinition({
      rawId: '49a',
      rawName: 'Budget (euros/hab.an)',
      referentiel: 'cae',
      definitionsByIdentifiant,
    }) === perCapitaDefinition,
    'the per-capita suffix should be restored'
  );
  assert(
    EmtIndicateurData.resolveDefinition({
      rawId: null,
      rawName: 'Budget politique cyclable  (euros/hab.an)',
      referentiel: 'cae',
      definitionsByIdentifiant,
    }) === mergedCyclableDefinition,
    'the cycling-budget merged-cell identifier should be restored'
  );
});

Deno.test('normalizes percentage values and annual periods', () => {
  const percentageDefinition = definition(1, 'cae_1.a', '%');

  assert(
    EmtIndicateurData.normalizeValeur('0.25%', percentageDefinition) === 25,
    'fractional percentages should use the historic 0-100 scale'
  );
  assert(
    EmtIndicateurData.parseAnnualPeriod('2 026')?.dateDebut === '2026-01-01',
    'spaced years should become canonical annual periods'
  );
});

Deno.test('preserves absent and invalid worksheet values as absent', () => {
  const percentageDefinition = definition(1, 'cae_1.a', '%');
  const absoluteDefinition = definition(2, 'cae_1.b');

  assert(
    EmtIndicateurData.normalizeValeur(null, percentageDefinition) === null,
    'an empty value should stay absent'
  );
  assert(
    EmtIndicateurData.normalizeValeur('inconnue', absoluteDefinition) === null,
    'a non-numeric value should stay absent'
  );
  assert(
    EmtIndicateurData.normalizeValeur('25%', percentageDefinition) === 25,
    'a percentage already expressed on the 0-100 scale should be preserved'
  );
  assert(
    EmtIndicateurData.normalizeValeur('0.25', absoluteDefinition) === 0.25,
    'an absolute fractional value should not be converted to a percentage'
  );
  for (const rawPeriod of [null, '', 0, 'année inconnue']) {
    assert(
      EmtIndicateurData.parseAnnualPeriod(rawPeriod) === null,
      `invalid period ${String(rawPeriod)} should stay absent`
    );
  }
});
