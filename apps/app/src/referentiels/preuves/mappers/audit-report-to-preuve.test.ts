import { LabellisationDemande } from '@tet/domain/referentiels';
import { describe, expect, it } from 'vitest';

import {
  AuditReportInput,
  auditReportToPreuve,
} from './audit-report-to-preuve';

const demande: LabellisationDemande = {
  id: 7,
  collectiviteId: 7,
  referentiel: 'cae',
  enCours: false,
  etoiles: '2',
  sujet: 'labellisation',
  modifiedAt: null,
  envoyeeLe: '2026-01-10T10:00:00Z',
  demandeur: null,
  associatedCollectiviteId: null,
};

const baseInput: AuditReportInput = {
  id: 42,
  collectiviteId: 7,
  commentaire: null,
  modifiedAt: '2026-01-15T10:00:00Z',
  modifiedBy: 'user-uuid',
  modifiedByNom: 'Alice Dupont',
  fichier: null,
  lien: null,
  audit: null,
  demande: null,
};

describe('auditReportToPreuve', () => {
  it('propage les champs communs et tag preuveType="audit"', () => {
    const preuve = auditReportToPreuve(baseInput);
    expect(preuve).toMatchObject({
      id: 42,
      collectiviteId: 7,
      commentaire: null,
      modifiedAt: '2026-01-15T10:00:00Z',
      modifiedBy: 'user-uuid',
      modifiedByNom: 'Alice Dupont',
      preuveType: 'audit',
    });
  });

  it('propage la demande, dont depend l invalidation du parcours apres suppression', () => {
    const preuve = auditReportToPreuve({ ...baseInput, demande });
    expect(preuve.demande).toEqual(demande);
  });

  it('cas fichier : conserve le fichier, force lien=null', () => {
    const fichier = {
      bucketId: 'b1',
      filename: 'rapport.pdf',
      filesize: 1024,
      hash: 'sha-1',
      confidentiel: false,
    };
    const preuve = auditReportToPreuve({ ...baseInput, fichier });
    expect(preuve.fichier).toEqual({
      bucketId: 'b1',
      filename: 'rapport.pdf',
      filesize: 1024,
      hash: 'sha-1',
      confidentiel: false,
    });
    expect(preuve.lien).toBeNull();
  });

  it('cas lien : conserve le lien, force fichier=null', () => {
    const lien = { url: 'https://example.com', titre: 'Doc externe' };
    const preuve = auditReportToPreuve({ ...baseInput, lien });
    expect(preuve.fichier).toBeNull();
    expect(preuve.lien).toEqual(lien);
  });

  it('cas non renseigné : fichier=null et lien=null', () => {
    const preuve = auditReportToPreuve(baseInput);
    expect(preuve.fichier).toBeNull();
    expect(preuve.lien).toBeNull();
  });

  it('priorise fichier sur lien si les deux sont fournis (input pathologique)', () => {
    const fichier = {
      bucketId: 'b1',
      filename: 'a.pdf',
      filesize: 1,
      hash: 'h',
      confidentiel: false,
    };
    const lien = { url: 'https://example.com', titre: 'X' };
    const preuve = auditReportToPreuve({ ...baseInput, fichier, lien });
    expect(preuve.fichier).toEqual({
      bucketId: 'b1',
      filename: 'a.pdf',
      filesize: 1,
      hash: 'h',
      confidentiel: false,
    });
    expect(preuve.lien).toBeNull();
  });
});
