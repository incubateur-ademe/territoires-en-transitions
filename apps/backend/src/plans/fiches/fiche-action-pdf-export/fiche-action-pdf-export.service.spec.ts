import FicheActionPermissionsService from '@tet/backend/plans/fiches/fiche-action-permissions.service';
import ListFichesService from '@tet/backend/plans/fiches/list-fiches/list-fiches.service';
import { buildRequesterUser } from '@tet/backend/users/models/auth.models';
import { failure, success } from '@tet/backend/utils/result.type';
import { describe, expect, it, vi } from 'vitest';
import { FicheActionPdfExportService } from './fiche-action-pdf-export.service';
import { FicheExportPayloadService } from './fiche-export-payload.service';
import { PdfRendererService } from './pdf-renderer.service';

const user = buildRequesterUser('00000000-0000-0000-0000-000000000001');

const toPayload = (ficheId: number) => ({ fiche: { id: ficheId } });

const toExportService = ({
  buildFicheExportPayload,
  render = vi.fn().mockResolvedValue(success(Buffer.from('pdf'))),
}: {
  buildFicheExportPayload: ReturnType<typeof vi.fn>;
  render?: ReturnType<typeof vi.fn>;
}) => {
  const payloadService = {
    buildFicheExportPayload,
  } as unknown as FicheExportPayloadService;
  const renderer = { render } as unknown as PdfRendererService;
  const fichePermissions = {
    canReadFiche: vi.fn().mockResolvedValue(undefined),
  } as unknown as FicheActionPermissionsService;
  const listFichesService = {} as unknown as ListFichesService;
  return new FicheActionPdfExportService(
    payloadService,
    renderer,
    fichePermissions,
    listFichesService
  );
};

describe('FicheActionPdfExportService.generatePdf', () => {
  it('retourne INTERNAL_ERROR quand le chargement du payload d’une fiche échoue en base, sans rendre le PDF', async () => {
    const render = vi.fn();
    const buildFicheExportPayload = vi
      .fn()
      .mockResolvedValueOnce(success(toPayload(1)))
      .mockResolvedValueOnce(
        failure('DATABASE_ERROR', new Error('lecture impossible'))
      );

    const result = await toExportService({
      buildFicheExportPayload,
      render,
    }).generatePdf({
      user,
      notesYears: 'all',
      mode: 'selection',
      ficheIds: [1, 2],
    });

    expect(result).toEqual(failure('INTERNAL_ERROR'));
    expect(render).not.toHaveBeenCalled();
  });

  it('exporte les autres fiches quand une fiche est indisponible', async () => {
    const buildFicheExportPayload = vi
      .fn()
      .mockResolvedValueOnce(success(toPayload(1)))
      .mockResolvedValueOnce(
        failure('FICHE_UNAVAILABLE', new Error('Fiche 2 : NOT_FOUND'))
      );

    const result = await toExportService({
      buildFicheExportPayload,
    }).generatePdf({
      user,
      notesYears: 'all',
      mode: 'selection',
      ficheIds: [1, 2],
    });

    expect(result).toMatchObject({
      success: true,
      data: { includedFicheIds: [1], skippedForErrorFicheIds: [2] },
    });
  });

  it('retourne NO_FICHES quand toutes les fiches sont indisponibles', async () => {
    const result = await toExportService({
      buildFicheExportPayload: vi
        .fn()
        .mockResolvedValue(
          failure('FICHE_UNAVAILABLE', new Error('Fiche 1 : NOT_FOUND'))
        ),
    }).generatePdf({
      user,
      notesYears: 'all',
      mode: 'selection',
      ficheIds: [1],
    });

    expect(result).toEqual(failure('NO_FICHES'));
  });
});
