import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { toLeviersGesHttpException } from './to-leviers-ges-http-exception';

describe('toLeviersGesHttpException', () => {
  test('invalid_request → 400 avec le détail des issues', () => {
    const issues = [
      { parameter: 'parameters.x', message: 'must be a decimal number' },
    ];
    const exception = toLeviersGesHttpException({
      kind: 'invalid_request',
      issues,
    });
    expect(exception).toBeInstanceOf(BadRequestException);
    expect(exception.getResponse()).toEqual({
      message: 'Requête invalide',
      issues,
    });
  });

  test('unknown_territory → 404', () => {
    expect(
      toLeviersGesHttpException({
        kind: 'unknown_territory',
        level: 'epci',
        code: '1',
      })
    ).toBeInstanceOf(NotFoundException);
  });

  test.each([
    { kind: 'level_not_computed', lever: 'haies', level: 'epci' },
    { kind: 'missing_data', dataset: 'd', key: 'k' },
  ] as const)('$kind → 422', (error) => {
    expect(toLeviersGesHttpException(error)).toBeInstanceOf(
      UnprocessableEntityException
    );
  });

  test('invalid_dataset → 500 sans fuite du détail', () => {
    const exception = toLeviersGesHttpException({
      kind: 'invalid_dataset',
      dataset: 'secret-dataset',
      reason: 'unreadable',
      detail: 'ENOENT /app/data',
    });
    expect(exception).toBeInstanceOf(InternalServerErrorException);
    expect(JSON.stringify(exception.getResponse())).not.toContain('ENOENT');
  });
});
