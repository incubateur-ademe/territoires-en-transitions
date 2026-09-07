import { describe, expect, it } from 'vitest';
import { readAutoAttachmentLanding } from './auto-attachment.landing';

const params = (query: string) => new URLSearchParams(query);

describe('readAutoAttachmentLanding', () => {
  it('lands a state service on its instruction space', () => {
    expect(
      readAutoAttachmentLanding(
        params('rattachement=42&rattachement-type=dreal')
      )
    ).toBe('/collectivite/42/demandes-avis');
    expect(
      readAutoAttachmentLanding(params('rattachement=7&rattachement-type=ddt'))
    ).toBe('/collectivite/7/demandes-avis');
  });

  /** Il se rejoint par identité, mais garde son propre tableau de bord. */
  it('leaves a conseil regional to the usual resolution', () => {
    expect(
      readAutoAttachmentLanding(
        params('rattachement=42&rattachement-type=region')
      )
    ).toBeNull();
  });

  it('gives no destination without both parameters', () => {
    expect(readAutoAttachmentLanding(params(''))).toBeNull();
    expect(readAutoAttachmentLanding(params('rattachement=42'))).toBeNull();
    expect(
      readAutoAttachmentLanding(params('rattachement-type=dreal'))
    ).toBeNull();
  });

  it('refuses anything that is not a positive integer id', () => {
    expect(
      readAutoAttachmentLanding(
        params('rattachement=0&rattachement-type=dreal')
      )
    ).toBeNull();
    expect(
      readAutoAttachmentLanding(
        params('rattachement=-3&rattachement-type=dreal')
      )
    ).toBeNull();
    expect(
      readAutoAttachmentLanding(
        params('rattachement=4.2&rattachement-type=dreal')
      )
    ).toBeNull();
    expect(
      readAutoAttachmentLanding(
        params('rattachement=..%2Fadmin&rattachement-type=dreal')
      )
    ).toBeNull();
  });

  it('refuses an unknown type', () => {
    expect(
      readAutoAttachmentLanding(
        params('rattachement=42&rattachement-type=prefecture_lunaire')
      )
    ).toBeNull();
  });
});
