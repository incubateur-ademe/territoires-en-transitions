import { BadRequestException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { failure } from '../result.type';
import { createControllerErrorHandler } from './controller-error-handler';

type TestError = 'WITH_MESSAGE' | 'WITHOUT_MESSAGE' | 'FROM_CAUSE';

const getResultDataOrThrow = createControllerErrorHandler<TestError>({
  specificErrors: {
    WITH_MESSAGE: { code: 'BAD_REQUEST', message: 'Message configuré' },
    WITHOUT_MESSAGE: { code: 'BAD_REQUEST' },
    FROM_CAUSE: { code: 'BAD_REQUEST', messageFromCause: true },
  },
});

const toThrownValue = (operation: () => unknown): unknown => {
  try {
    operation();
  } catch (error) {
    return error;
  }
  return undefined;
};

describe('createControllerErrorHandler', () => {
  it('lance une exception HTTP avec le message configuré quand la config en fixe un', () => {
    const thrown = toThrownValue(() =>
      getResultDataOrThrow(failure('WITH_MESSAGE', new Error('détail')))
    );

    expect(thrown).toBeInstanceOf(BadRequestException);
    expect(thrown).toMatchObject({ message: 'Message configuré' });
  });

  it('lance l’exception HTTP par défaut quand la config n’a pas de message', () => {
    const thrown = toThrownValue(() =>
      getResultDataOrThrow(failure('WITHOUT_MESSAGE', new Error('détail')))
    );

    expect(thrown).toBeInstanceOf(BadRequestException);
    expect(thrown).toMatchObject({ message: 'Bad Request' });
  });

  it('lance une exception HTTP portant le message de la cause quand la config le demande', () => {
    const thrown = toThrownValue(() =>
      getResultDataOrThrow(failure('FROM_CAUSE', new Error('détail précis')))
    );

    expect(thrown).toBeInstanceOf(BadRequestException);
    expect(thrown).toMatchObject({ message: 'détail précis' });
  });

  it('lance l’exception HTTP par défaut quand la config demande le message de la cause et qu’il n’y en a pas', () => {
    const thrown = toThrownValue(() =>
      getResultDataOrThrow(failure('FROM_CAUSE'))
    );

    expect(thrown).toBeInstanceOf(BadRequestException);
    expect(thrown).toMatchObject({ message: 'Bad Request' });
  });

  it('lance l’exception HTTP par défaut quand le message de la cause est vide', () => {
    const thrown = toThrownValue(() =>
      getResultDataOrThrow(failure('FROM_CAUSE', new Error('')))
    );

    expect(thrown).toBeInstanceOf(BadRequestException);
    expect(thrown).toMatchObject({ message: 'Bad Request' });
  });
});
