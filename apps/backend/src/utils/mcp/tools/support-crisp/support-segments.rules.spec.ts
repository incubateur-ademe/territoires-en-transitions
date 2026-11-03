import { CrispMessage } from './crisp-api.client';
import {
  buildTermesMatcher,
  estimateHumanMinutes,
  normalizeSegment,
  parseSegment,
  segmentMatchesSujet,
  spreadSample,
  toExcerpt,
} from './support-segments.rules';

const MINUTE = 60_000;
const human = (minute: number, type = 'text'): CrispMessage => ({
  from: 'operator',
  type,
  origin: 'chat',
  timestamp: minute * MINUTE,
  user: { user_id: 'operateur-1' },
});

describe('segments du support', () => {
  test('normalise accents, casse, espaces et tirets', () => {
    expect(normalizeSegment(' Besoin_guidage_référentiel_CR ')).toBe(
      'besoin_guidage_referentiel_cr'
    );
    expect(normalizeSegment('support demandé')).toBe('support_demande');
    expect(normalizeSegment('connexion-acces')).toBe('connexion_acces');
  });

  test('découpe type et sujet, reconnaît parcours et ancienne taxonomie', () => {
    expect(parseSegment('besoin_guidage_référentiel_cr')).toEqual({
      kind: 'classement',
      normalized: 'besoin_guidage_referentiel_cr',
      type: 'besoin_guidage',
      sujet: 'referentiel_cr',
    });
    expect(parseSegment('support_obligatoire')).toMatchObject({
      type: 'support_obligatoire',
      sujet: null,
    });
    expect(parseSegment('guidage_audit_labellisation')).toMatchObject({
      type: 'besoin_guidage',
      sujet: 'audit_labellisation',
    });
    expect(parseSegment('assistant accepté')).toEqual({
      kind: 'parcours',
      normalized: 'assistant_accepte',
    });
    expect(parseSegment('edl-cae')).toEqual({
      kind: 'ancien',
      normalized: 'edl_cae',
    });
    expect(parseSegment('autres')).toMatchObject({ kind: 'ancien' });
  });

  test('un sujet correspond à des mots consécutifs du segment', () => {
    const cr = parseSegment('bug_referentiel_cr');
    expect(segmentMatchesSujet(cr, 'cr')).toBe(true);
    expect(segmentMatchesSujet(cr, 'référentiel')).toBe(true);
    expect(segmentMatchesSujet(cr, 'referentiel_cr')).toBe(true);
    expect(segmentMatchesSujet(cr, 'bug')).toBe(true);
    expect(segmentMatchesSujet(cr, 'besoin_guidage')).toBe(false);
    expect(
      segmentMatchesSujet(parseSegment('besoin_guidage_referentiel'), 'cr')
    ).toBe(false);
    expect(
      segmentMatchesSujet(parseSegment('support_obligatoire_creation_ct'), 'cr')
    ).toBe(false);
    expect(segmentMatchesSujet(parseSegment('edl-cae'), 'cae')).toBe(true);
    expect(
      segmentMatchesSujet(parseSegment('reprise humaine'), 'humaine')
    ).toBe(false);
  });
});

describe('temps passé estimé', () => {
  test('regroupe les messages humains en interventions', () => {
    const messages: CrispMessage[] = [
      { from: 'user', type: 'text', timestamp: 0 },
      human(1),
      human(6, 'note'),
      // bot et plugin : ignorés
      {
        from: 'operator',
        type: 'text',
        origin: 'urn:crisp.im:bot:0',
        timestamp: 2 * MINUTE,
        user: { type: 'website' },
      },
      { from: 'operator', type: 'note', origin: 'chat', timestamp: 3 * MINUTE },
      { ...human(4), type: 'event' },
      // nouvelle intervention le lendemain
      human(24 * 60),
    ];

    // (6 - 1) + 3, puis 0 + 3
    expect(estimateHumanMinutes(messages)).toBe(11);
  });

  test('zéro sans message humain', () => {
    expect(
      estimateHumanMinutes([{ from: 'user', type: 'text', timestamp: 0 }])
    ).toBe(0);
  });
});

test('masque e-mails et téléphones, puis tronque', () => {
  expect(
    toExcerpt(
      'Écrire à Jean.Dupont@mairie-x.fr ou au 06 12 34 56 78, ou +33 1 23 45 67 89',
      200
    )
  ).toBe('Écrire à [e-mail] ou au [téléphone], ou [téléphone]');
  expect(toExcerpt('abcdefghij', 5)).toBe('abcd…');
});

test("l'échantillon est réparti sur toute la liste", () => {
  const items = Array.from({ length: 10 }, (_, index) => index);
  expect(spreadSample(items, 5)).toEqual([0, 2, 4, 6, 8]);
  expect(spreadSample(items, 20)).toBe(items);
});

test('cherche les termes en mot entier, sans accents ni casse', () => {
  const matches = buildTermesMatcher(['CR', 'nouveau référentiel']);
  expect(matches('Question sur le CR.')).toBe(true);
  expect(matches('le Nouveau Referentiel arrive')).toBe(true);
  expect(matches('un crédit')).toBe(false);
  expect(matches('cr')).toBe(true);
  expect(buildTermesMatcher(['c++'])('du c++ ici')).toBe(true);
});
