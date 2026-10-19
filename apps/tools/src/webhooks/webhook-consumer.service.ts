import { Processor, WorkerHost } from '@nestjs/bullmq';
import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { WEBHOOK_NOTIFICATIONS_QUEUE_NAME } from '@tet/backend/utils/bullmq/queue-names.constants';
import { ContextStoreService } from '@tet/backend/utils/context/context.service';
import { captureException } from '@tet/backend/utils/error-tracking/capture-exception';
import { webhookConfigurationTable } from '@tet/backend/utils/webhooks/webhook-configuration.table';
import { webhookMessageTable } from '@tet/backend/utils/webhooks/webhook-message.table';
import {
  ApplicationSousScopesType,
  getErrorMessage,
  WebhookAuthenticationMethod,
  WebhookAuthenticationMethodEnum,
  WebhookConfiguration,
  WebhookPayloadFormat,
  WebhookPayloadFormatEnum,
  WebhookStatus,
} from '@tet/domain/utils';
import { Job } from 'bullmq';
import { and, eq, ne } from 'drizzle-orm';
import { DateTime } from 'luxon';
import { z } from 'zod';
import ConfigurationService from '../config/configuration.service';
import { InjectDrizzle } from '@nestjs/drizzle';
import type { Database } from '../utils/database/database.type';
import { IEntityMapper } from './mappers/AbstractEntityMapper';
import { CommunsFicheActionMapper } from './mappers/communs/communs-fiche-action.mapper';

@Processor(WEBHOOK_NOTIFICATIONS_QUEUE_NAME)
@Injectable()
export class WebhookConsumerService extends WorkerHost {
  private readonly logger = new Logger(WebhookConsumerService.name);

  private secretMap: Record<string, string> | null = null;

  private readonly entityMappers: Map<string, IEntityMapper> = new Map();

  constructor(
    @InjectDrizzle() private readonly db: Database,
    private readonly configurationService: ConfigurationService,
    private readonly contextStoreService: ContextStoreService
  ) {
    super();

    this.registerEntityMapper(new CommunsFicheActionMapper());
  }

  private registerEntityMapper(entityMapper: IEntityMapper) {
    const key = `${entityMapper.entityType}_${entityMapper.format}`;
    if (this.entityMappers.has(key)) {
      throw new InternalServerErrorException(
        `Entity mapper for ${key} already registered`
      );
    }
    this.entityMappers.set(key, entityMapper);
  }

  private getEntityMapper(
    entityType: ApplicationSousScopesType,
    format: WebhookPayloadFormat
  ): IEntityMapper {
    const mapper = this.entityMappers.get(`${entityType}_${format}`);
    if (!mapper) {
      throw new InternalServerErrorException(
        `Entity mapper for ${entityType} and format ${format} not found`
      );
    }
    return mapper;
  }

  getSecretMap(): Record<string, string> {
    if (this.secretMap) {
      return this.secretMap;
    }
    // TODO: understand why we need to parse again the secret map
    const configSecretMap = this.configurationService.get(
      'EXTERNAL_SYSTEM_SECRET_MAP'
    );
    if (typeof configSecretMap !== 'object') {
      if (typeof configSecretMap === 'string') {
        try {
          this.secretMap = JSON.parse(configSecretMap);
        } catch (error) {
          throw new InternalServerErrorException(
            `Secret map is not a valid JSON string: ${getErrorMessage(error)}`
          );
        }
      } else {
        throw new InternalServerErrorException(
          `Secret map is not a string object: type ${typeof configSecretMap}`
        );
      }
    } else {
      this.secretMap = configSecretMap;
    }
    return this.secretMap as Record<string, string>;
  }

  async getWebhookConfiguration(ref: string): Promise<WebhookConfiguration> {
    this.logger.log(`Getting webhook configuration for ref: ${ref}`);
    const webhookConfigurations = await this.db
      .select()
      .from(webhookConfigurationTable)
      .where(eq(webhookConfigurationTable.ref, ref));
    if (!webhookConfigurations.length) {
      throw new NotFoundException(
        `Webhook configuration not found for ref: ${ref}`
      );
    }
    return webhookConfigurations[0] as WebhookConfiguration;
  }

  async getAuthenticationHeaders(
    authenticationMethod: WebhookAuthenticationMethod,
    secret: any
  ): Promise<Record<string, string>> {
    this.logger.log(
      `Getting authentication headers for method: ${authenticationMethod}`
    );
    const headers: Record<string, string> = {};
    switch (authenticationMethod) {
      case WebhookAuthenticationMethodEnum.BEARER:
        headers['Authorization'] = `Bearer ${secret}`;
        break;
      case WebhookAuthenticationMethodEnum.BASIC:
        // secret is supposed to be in the format "username:password"
        headers['Authorization'] = `Basic ${Buffer.from(secret).toString(
          'base64'
        )}`;
        break;
    }
    return headers;
  }

  async sendWebhookNotificationAndSave({
    url,
    authenticationMethod,
    secretKey,
    payload,
    retryCount,
    jobId,
  }: {
    url: string;
    authenticationMethod: WebhookAuthenticationMethod;
    secretKey: string;
    payload: any;
    retryCount: number;
    jobId: string;
  }): Promise<any> {
    const secretMap = this.getSecretMap();

    const secret = secretKey ? secretMap[secretKey] : '';
    if (secretKey && !secret) {
      throw new InternalServerErrorException(
        `Secret key ${secretKey} not found in configuration`
      );
    }
    this.logger.log(`Using secret key ${secretKey} for authentication`);

    const headers = await this.getAuthenticationHeaders(
      authenticationMethod,
      secret
    );
    headers['Content-Type'] = 'application/json';
    headers['Idempotency-Key'] = jobId;

    const response = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10_000),
    });
    const responseText = await response.text();
    let externalId: string | null = null;
    const status: WebhookStatus = response.ok ? 'success' : 'error';
    let jsonResponse: any = null;
    if (!response.ok) {
      this.logger.error(`Error sending webhook notification: ${responseText}`);
      throw new InternalServerErrorException(
        `Error sending webhook notification: ${responseText}`
      );
    } else {
      try {
        jsonResponse = JSON.parse(responseText);
        this.logger.log(`Webhook response: ${JSON.stringify(jsonResponse)}`);
        externalId = jsonResponse.id || null;
      } catch {
        // Do not throw, just to retrieve external id if needed
      }
    }

    if (jobId) {
      this.logger.log(`Updating job ${jobId} in database to status ${status}`);
      await this.db
        .update(webhookMessageTable)
        .set({
          status: status,
          entityExternalId: externalId,
          error: status === 'error' ? responseText : null,
          sentPayload: payload,
          response: jsonResponse,
          retryCount: retryCount,
          modifiedAt: DateTime.now().toISO(),
        })
        .where(eq(webhookMessageTable.id, jobId));
    } else {
      this.logger.warn(`Job ID not found, skipping database update`);
    }

    return jsonResponse || responseText;
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const messageId = z.uuid().parse(job.data.id);
    if (messageId !== job.id)
      throw new Error('Webhook job id does not match its message');
    const [jobData] = await this.db
      .select()
      .from(webhookMessageTable)
      .where(eq(webhookMessageTable.id, messageId));
    if (!jobData) throw new NotFoundException('Webhook message not found');
    // Redis may have purged a completed job before a relay retries its acknowledgement.
    if (jobData.status === 'success') return jobData.response;

    try {
      this.logger.log(
        `Processing job ${job.id} (retry ${job.attemptsStarted})`
      );

      const webhookConfiguration = await this.getWebhookConfiguration(
        jobData.configurationRef
      );
      this.logger.log(
        `Found configuration ${webhookConfiguration.ref} with payloadFormat ${webhookConfiguration.payloadFormat} and authentication method ${webhookConfiguration.authenticationMethod}`
      );

      let payload: unknown = jobData.payload;
      if (
        webhookConfiguration.payloadFormat !== WebhookPayloadFormatEnum.DEFAULT
      ) {
        this.logger.log(
          `Transforming payload to ${webhookConfiguration.payloadFormat}`
        );
        const mapper = this.getEntityMapper(
          webhookConfiguration.entityType,
          webhookConfiguration.payloadFormat
        );
        payload = mapper.map(payload);
      } else {
        this.logger.log(`No transformation needed for payload`);
      }

      if (payload) {
        this.logger.log(
          `Sending webhook notification to ${webhookConfiguration.url}`
        );
        const response = await this.sendWebhookNotificationAndSave({
          url: webhookConfiguration.url,
          authenticationMethod: webhookConfiguration.authenticationMethod,
          secretKey: webhookConfiguration.secretKey,
          retryCount: job.attemptsStarted,
          payload,
          jobId: jobData.id,
        });

        return response;
      } else {
        this.logger.log(`No payload to send, event has been filtered out`);
        await this.db
          .update(webhookMessageTable)
          .set({
            status: 'success',
            retryCount: job.attemptsStarted,
            modifiedAt: DateTime.now().toISO(),
          })
          .where(eq(webhookMessageTable.id, jobData.id));
      }

      return {};
    } catch (error) {
      this.logger.error(error);
      this.logger.error(
        `Error processing job ${
          job.id
        } for queue ${WEBHOOK_NOTIFICATIONS_QUEUE_NAME}: ${getErrorMessage(
          error
        )}`
      );

      captureException(error, this.contextStoreService.getContext(), {
        jobId: job.id,
        jobName: job.name,
        queueName: WEBHOOK_NOTIFICATIONS_QUEUE_NAME,
      });

      if (job.id) {
        await this.db
          .update(webhookMessageTable)
          .set({
            status: 'error',
            error: getErrorMessage(error),
            retryCount: job.attemptsStarted,
            modifiedAt: DateTime.now().toISO(),
          })
          .where(
            and(
              eq(webhookMessageTable.id, jobData.id),
              ne(webhookMessageTable.status, 'success')
            )
          );
      }

      // Throw is triggering the retry
      throw error;
    }
  }
}
