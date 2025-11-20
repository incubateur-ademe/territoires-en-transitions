import {
  ApplicationSousScopesType,
  WebhookPayloadFormat,
} from '@tet/domain/utils';

export interface IEntityMapper {
  entityType: ApplicationSousScopesType;
  format: WebhookPayloadFormat;

  map(input: unknown): unknown;
}

export abstract class AbstractEntityMapper<FromType, ToType>
  implements IEntityMapper
{
  constructor(
    public readonly entityType: ApplicationSousScopesType,
    public readonly format: WebhookPayloadFormat
  ) {}

  /**
   * Return null if we don't want to send the event
   * @param input
   */
  abstract map(input: FromType): ToType | null;
}
