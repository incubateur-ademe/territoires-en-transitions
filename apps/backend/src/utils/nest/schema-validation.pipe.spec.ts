import { BadRequestException } from '@nestjs/common';
import { listCollectiviteApiRequestSchema } from '@tet/backend/collectivites/list-collectivites/list-collectivites.api-request';
import { exportIndicateursRequestSchema } from '@tet/backend/indicateurs/indicateurs/export-indicateurs/export-indicateurs.request';
import { listSnapshotsApiParamsSchema } from '@tet/backend/referentiels/snapshots/list-snapshots/list-snapshots.api-params';
import {
  LIST_DEFAULT_JALONS,
  listSnapshotsApiQuerySchema,
} from '@tet/backend/referentiels/snapshots/list-snapshots/list-snapshots.api-query';
import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { ContextStoreService } from '../context/context.service';
import { SchemaValidationPipe } from './schema-validation.pipe';

describe('SchemaValidationPipe', () => {
  const createPipe = () => {
    const context = new ContextStoreService();
    const enrichContext = vi.spyOn(context, 'autoSetContextFromPayload');
    return { pipe: new SchemaValidationPipe(context), enrichContext };
  };

  it('coerces query values, applies defaults and removes unknown fields', async () => {
    const { pipe, enrichContext } = createPipe();

    const result = await pipe.transform(
      { collectiviteId: '42', page: '2', unknown: 'discard' },
      { type: 'query', schema: listCollectiviteApiRequestSchema }
    );

    expect(result).toEqual({ collectiviteId: 42, page: 2, limit: 20 });
    expect(enrichContext).toHaveBeenCalledWith(result);
  });

  it('validates and coerces route parameters', async () => {
    const { pipe } = createPipe();

    const result = await pipe.transform(
      { collectiviteId: '42', referentielId: 'cae' },
      { type: 'param', schema: listSnapshotsApiParamsSchema }
    );

    expect(result).toEqual({ collectiviteId: 42, referentielId: 'cae' });
  });

  it('validates discriminated union bodies and applies branch defaults', async () => {
    const { pipe } = createPipe();

    const result = await pipe.transform(
      { mode: 'all', collectiviteId: 42 },
      { type: 'body', schema: exportIndicateursRequestSchema }
    );

    expect(result).toEqual({ mode: 'all', collectiviteId: 42, filters: {} });
    await expect(
      pipe.transform(
        { mode: 'selection', collectiviteId: 42, indicateurIds: [] },
        { type: 'body', schema: exportIndicateursRequestSchema }
      )
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('transforms comma separated query values and supplies default jalons', async () => {
    const { pipe } = createPipe();
    const metadata = {
      type: 'query',
      schema: listSnapshotsApiQuerySchema,
    } as const;

    const result = await pipe.transform(
      { jalons: LIST_DEFAULT_JALONS.slice(0, 2).join(',') },
      metadata
    );

    expect(result).toEqual({ jalons: LIST_DEFAULT_JALONS.slice(0, 2) });
    expect(await pipe.transform({}, metadata)).toEqual({
      jalons: LIST_DEFAULT_JALONS,
    });
  });

  it('returns structured validation issues and does not enrich context on failure', async () => {
    const { pipe, enrichContext } = createPipe();
    const schema = z.object({
      valeurs: z.array(z.object({ valeur: z.number() })),
    });
    const input = { valeurs: [{ valeur: 'invalid' }] };
    const result = schema.safeParse(input);

    await expect(
      pipe.transform(input, { type: 'body', schema })
    ).rejects.toMatchObject({
      response: {
        statusCode: 400,
        message: 'Validation failed',
        errors: result.error?.issues,
      },
    });
    expect(enrichContext).not.toHaveBeenCalled();
  });

  it('awaits asynchronous validation before enriching the request context', async () => {
    const { pipe, enrichContext } = createPipe();
    const schema = z
      .object({ collectiviteId: z.string() })
      .transform(async (value) => ({
        collectiviteId: Number(value.collectiviteId),
      }));

    const result = await pipe.transform(
      { collectiviteId: '42' },
      { type: 'body', schema }
    );

    expect(result).toEqual({ collectiviteId: 42 });
    expect(enrichContext).toHaveBeenCalledWith({ collectiviteId: 42 });
  });

  it('passes parameters without a schema through unchanged', async () => {
    const { pipe } = createPipe();
    const value = { id: 'authenticated-user' };

    expect(await pipe.transform(value, { type: 'custom' })).toBe(value);
  });
});
