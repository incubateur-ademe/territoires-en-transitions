import {
  matchReferentiel,
  parseReferentielArg,
} from './parse-referentiel-arg';

describe('parseReferentielArg', () => {
  it('retourne le referentielId seul quand il n y a pas de version', () => {
    expect(parseReferentielArg('te')).toEqual({ referentielId: 'te' });
    expect(parseReferentielArg('cae')).toEqual({ referentielId: 'cae' });
    expect(parseReferentielArg('eci')).toEqual({ referentielId: 'eci' });
    expect(parseReferentielArg('te-test')).toEqual({
      referentielId: 'te-test',
    });
  });

  it('retourne referentielId et version quand une version semver valide est présente', () => {
    expect(parseReferentielArg('te_2.1.3')).toEqual({
      referentielId: 'te',
      version: '2.1.3',
    });
    expect(parseReferentielArg('cae_1.0.0')).toEqual({
      referentielId: 'cae',
      version: '1.0.0',
    });
  });

  it('lève une erreur pour un référentiel inconnu sans version', () => {
    expect(() => parseReferentielArg('xx')).toThrow(
      'Référentiel "xx" inconnu dans referentiel(xx).'
    );
  });

  it('lève une erreur pour un référentiel inconnu avec version', () => {
    expect(() => parseReferentielArg('xx_1.0.0')).toThrow(
      'Référentiel "xx" inconnu dans referentiel(xx_1.0.0).'
    );
  });

  it('lève une erreur quand la version est mal formée (non semver)', () => {
    expect(() => parseReferentielArg('te_9.9')).toThrow(
      'Version "9.9" invalide dans referentiel(te_9.9).'
    );
  });

  it('lève une erreur quand la version est vide (underscore sans version)', () => {
    expect(() => parseReferentielArg('te_')).toThrow(
      'Version "" invalide dans referentiel(te_).'
    );
  });
});

describe('matchReferentiel', () => {
  it('retourne true quand le referentielId correspond exactement', () => {
    expect(
      matchReferentiel({ referentielId: 'te' }, { referentielId: 'te' })
    ).toBe(true);
    expect(
      matchReferentiel({ referentielId: 'cae' }, { referentielId: 'cae' })
    ).toBe(true);
  });

  it('retourne false quand les referentielIds diffèrent', () => {
    expect(
      matchReferentiel({ referentielId: 'cae' }, { referentielId: 'te' })
    ).toBe(false);
    expect(
      matchReferentiel({ referentielId: 'eci' }, { referentielId: 'cae' })
    ).toBe(false);
  });

  it('retourne true pour te-test dans la famille te', () => {
    expect(
      matchReferentiel({ referentielId: 'te-test' }, { referentielId: 'te' })
    ).toBe(true);
  });

  it('retourne false pour te dans la famille te-test (non symétrique)', () => {
    expect(
      matchReferentiel(
        { referentielId: 'te' },
        { referentielId: 'te-test' }
      )
    ).toBe(false);
  });

  it('retourne true quand la version courante >= version min', () => {
    expect(
      matchReferentiel(
        { referentielId: 'te', version: '2.2.0' },
        { referentielId: 'te', version: '2.1.3' }
      )
    ).toBe(true);

    expect(
      matchReferentiel(
        { referentielId: 'te', version: '2.1.3' },
        { referentielId: 'te', version: '2.1.3' }
      )
    ).toBe(true);
  });

  it('retourne false quand la version courante < version min', () => {
    expect(
      matchReferentiel(
        { referentielId: 'te', version: '2.1.2' },
        { referentielId: 'te', version: '2.1.3' }
      )
    ).toBe(false);
  });

  it('retourne false quand une version min est précisée mais que le contexte courant n a pas de version', () => {
    expect(
      matchReferentiel(
        { referentielId: 'te' },
        { referentielId: 'te', version: '2.1.3' }
      )
    ).toBe(false);
  });

  it('retourne true pour te-test avec version min satisfaite', () => {
    expect(
      matchReferentiel(
        { referentielId: 'te-test', version: '2.2.0' },
        { referentielId: 'te', version: '2.1.3' }
      )
    ).toBe(true);
  });
});
