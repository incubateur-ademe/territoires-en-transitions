import { ApplicationSousScopesType } from '@/backend/utils/application-domains.enum';
import { WebhookPayloadFormatType } from '@/backend/utils/webhooks/webhook-payload-format.enum';

export interface IEntityMapper {
  entityType: ApplicationSousScopesType;
  format: WebhookPayloadFormatType;

  map(input: unknown): unknown;
}

export abstract class AbstractEntityMapper<FromType, ToType>
  implements IEntityMapper
{
  constructor(
    public readonly entityType: ApplicationSousScopesType,
    public readonly format: WebhookPayloadFormatType
  ) {}

  /**
   * Return null if we don't want to send the event
   * @param input
   */
  abstract map(input: FromType): ToType | null;
}
