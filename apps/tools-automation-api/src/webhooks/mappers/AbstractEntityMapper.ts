import { ApplicationSousScopesType } from '../../../../../backend/src/utils/application-domains.enum';
import { WebhookPayloadFormatType } from '../../../../../backend/src/utils/index-domain';

export interface IEntityMapper {
  entityType: ApplicationSousScopesType;
  format: WebhookPayloadFormatType;

  map(input: any): any;
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
