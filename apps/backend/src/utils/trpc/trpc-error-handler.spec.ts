import { describe, expect, it } from 'vitest';
import { failure } from '../result.type';
import { createTrpcErrorHandler } from './trpc-error-handler';

type TestError = 'WITH_MESSAGE' | 'WITHOUT_MESSAGE' | 'FROM_CAUSE';

const getResultDataOrThrow = createTrpcErrorHandler<TestError>({
  specificErrors: {
    WITH_MESSAGE: { code: 'BAD_REQUEST', message: 'Message configuré' },
    WITHOUT_MESSAGE: { code: 'BAD_REQUEST' },
    FROM_CAUSE: { code: 'BAD_REQUEST', messageFromCause: true },
  },
});

describe('createTrpcErrorHandler', () => {
  it('lance le message configuré quand la config en fixe un', () => {
    expect(() =>
      getResultDataOrThrow(failure('WITH_MESSAGE', new Error('détail')))
    ).toThrow(
      expect.objectContaining({
        code: 'BAD_REQUEST',
        message: 'Message configuré',
      })
    );
  });

  it('lance le code de l’erreur quand la config n’a pas de message', () => {
    expect(() =>
      getResultDataOrThrow(failure('WITHOUT_MESSAGE', new Error('détail')))
    ).toThrow(
      expect.objectContaining({
        code: 'BAD_REQUEST',
        message: 'WITHOUT_MESSAGE',
      })
    );
  });

  it('lance le message de la cause quand la config le demande', () => {
    expect(() =>
      getResultDataOrThrow(failure('FROM_CAUSE', new Error('détail précis')))
    ).toThrow(
      expect.objectContaining({ code: 'BAD_REQUEST', message: 'détail précis' })
    );
  });

  it('retombe sur le code de l’erreur quand la config demande le message de la cause et qu’il n’y en a pas', () => {
    expect(() => getResultDataOrThrow(failure('FROM_CAUSE'))).toThrow(
      expect.objectContaining({ code: 'BAD_REQUEST', message: 'FROM_CAUSE' })
    );
  });

  it('retombe sur le code de l’erreur quand le message de la cause est vide', () => {
    expect(() =>
      getResultDataOrThrow(failure('FROM_CAUSE', new Error('')))
    ).toThrow(
      expect.objectContaining({ code: 'BAD_REQUEST', message: 'FROM_CAUSE' })
    );
  });

  it('conserve la cause dans l’erreur lancée quand la config demande son message', () => {
    const cause = new Error('détail précis');

    expect(() => getResultDataOrThrow(failure('FROM_CAUSE', cause))).toThrow(
      expect.objectContaining({ cause })
    );
  });

  it('applique le message de la cause à une erreur commune surchargée', () => {
    const getOverriddenResultDataOrThrow = createTrpcErrorHandler({
      commonErrors: {
        SERVER_ERROR: {
          code: 'INTERNAL_SERVER_ERROR',
          messageFromCause: true,
        },
      },
    });

    expect(() =>
      getOverriddenResultDataOrThrow(
        failure('SERVER_ERROR', new Error('détail précis'))
      )
    ).toThrow(
      expect.objectContaining({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'détail précis',
      })
    );
  });
});
