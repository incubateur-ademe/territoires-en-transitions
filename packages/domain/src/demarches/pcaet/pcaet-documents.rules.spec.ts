import { describe, expect, it } from 'vitest';
import { DemarchePcaetStatusEnum } from './demarche-pcaet-status.enum.schema';
import {
  isDemarchePcaetDocumentsMutable,
  isPcaetDocumentFileAccepted,
} from './pcaet-documents.rules';

describe('isPcaetDocumentFileAccepted', () => {
  it('accepte un PDF', () => {
    expect(
      isPcaetDocumentFileAccepted({
        filename: 'pcaet.pdf',
        mimeType: 'application/pdf',
      })
    ).toBe(true);
  });

  it('accepte un PDF dont le mime type est inconnu du stockage', () => {
    expect(isPcaetDocumentFileAccepted({ filename: 'pcaet.PDF' })).toBe(true);
    expect(
      isPcaetDocumentFileAccepted({ filename: 'pcaet.pdf', mimeType: null })
    ).toBe(true);
  });

  it('refuse une autre extension', () => {
    expect(
      isPcaetDocumentFileAccepted({
        filename: 'pcaet.docx',
        mimeType: 'application/pdf',
      })
    ).toBe(false);
    expect(isPcaetDocumentFileAccepted({ filename: 'pcaet' })).toBe(false);
  });

  it('refuse un nom sans véritable extension', () => {
    // Un nom qui EST « pdf » n'a pas d'extension pdf.
    expect(isPcaetDocumentFileAccepted({ filename: 'pdf' })).toBe(false);
    expect(isPcaetDocumentFileAccepted({ filename: '.pdf' })).toBe(false);
    expect(isPcaetDocumentFileAccepted({ filename: 'pcaet.' })).toBe(false);
    expect(isPcaetDocumentFileAccepted({ filename: '' })).toBe(false);
    // Un point dans le nom ne perturbe pas la lecture de l'extension.
    expect(isPcaetDocumentFileAccepted({ filename: 'pcaet.v2.pdf' })).toBe(true);
  });

  it('refuse un mime type incohérent avec l’extension', () => {
    expect(
      isPcaetDocumentFileAccepted({
        filename: 'pcaet.pdf',
        mimeType: 'application/zip',
      })
    ).toBe(false);
  });
});

describe('isDemarchePcaetDocumentsMutable', () => {
  it('n’autorise les dépôts que pendant l’élaboration', () => {
    expect(
      isDemarchePcaetDocumentsMutable(DemarchePcaetStatusEnum.EN_ELABORATION)
    ).toBe(true);
    expect(
      isDemarchePcaetDocumentsMutable(DemarchePcaetStatusEnum.TRANSMIS_POUR_AVIS)
    ).toBe(false);
    expect(isDemarchePcaetDocumentsMutable(DemarchePcaetStatusEnum.ADOPTE)).toBe(
      false
    );
    expect(
      isDemarchePcaetDocumentsMutable(DemarchePcaetStatusEnum.ARCHIVE)
    ).toBe(false);
  });
});
