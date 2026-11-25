import {
  ForbiddenException,
  InternalServerErrorException,
  PayloadTooLargeException,
} from '@nestjs/common';
import type { Response } from 'express';
import { failure, success } from '@tet/backend/utils/result.type';
import { describe, expect, it, vi } from 'vitest';
import { ExportIndicateursController } from './export-indicateurs.controller';
import { toExportTooLargeFailure } from './export-indicateurs.errors';
import ExportIndicateursService from './export-indicateurs.service';

const request = {
  collectiviteId: 1,
  mode: 'selection',
  indicateurIds: [1],
} as never;
const user = { id: 'user' } as never;

const toController = (exportXLSX: ReturnType<typeof vi.fn>) =>
  new ExportIndicateursController({
    exportXLSX,
  } as unknown as ExportIndicateursService);

const toResponse = () => {
  const send = vi.fn();
  const status = vi.fn().mockReturnValue({ send });
  const set = vi.fn();
  return {
    response: { status, send, set } as unknown as Response,
    status,
    send,
    set,
  };
};

describe('ExportIndicateursController.exportIndicateurs', () => {
  it('répond 404 « Données non trouvées » en texte brut quand rien n’est exportable', async () => {
    const { response, status, send } = toResponse();

    await toController(
      vi.fn().mockResolvedValue(success(null))
    ).exportIndicateurs(request, user, response);

    expect(status).toHaveBeenCalledWith(404);
    expect(send).toHaveBeenCalledWith('Données non trouvées');
  });

  it('envoie le fichier avec ses en-têtes quand l’export réussit', async () => {
    const { response, send, set } = toResponse();
    const buffer = Buffer.from('xlsx');

    await toController(
      vi.fn().mockResolvedValue(success({ buffer, filename: 'Ville.xlsx' }))
    ).exportIndicateurs(request, user, response);

    expect(set).toHaveBeenCalledWith(
      'Content-Disposition',
      'attachment; filename="Ville.xlsx"'
    );
    expect(send).toHaveBeenCalledWith(buffer);
  });

  it.each([
    [
      'un refus en 403',
      failure('UNAUTHORIZED', new Error('Droits insuffisants')),
      new ForbiddenException('Droits insuffisants'),
    ],
    [
      'un export trop volumineux en 413',
      toExportTooLargeFailure(5000),
      new PayloadTooLargeException(
        "L'export dépasse la limite technique de 5000 indicateurs"
      ),
    ],
    [
      'une erreur de lecture en 500 avec le message de la cause',
      failure('DATABASE_ERROR', new Error('lecture impossible')),
      new InternalServerErrorException('lecture impossible'),
    ],
  ])('traduit %s', async (_title, exportResult, expected) => {
    const { response } = toResponse();

    await expect(
      toController(vi.fn().mockResolvedValue(exportResult)).exportIndicateurs(
        request,
        user,
        response
      )
    ).rejects.toEqual(expected);
  });
});
