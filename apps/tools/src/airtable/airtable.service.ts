import { Injectable, Logger } from '@nestjs/common';
import { chunk } from 'es-toolkit';
import { DateTime } from 'luxon';
import ConfigurationService from '../config/configuration.service';
import {
  CrispSessionMessage,
  CrispUser,
} from '../crisp/models/get-crisp-session-messages.response';
import { CrispSession } from '../crisp/models/get-crisp-session.response';
import { sleep } from '../utils/sleep.utils';
import { AirtableErrorResponse } from './airtable-error.response';
import { AirtableFeedbackRecord } from './airtable-feedback.record';
import { AirtableFetchRecordsRequest } from './airtable-fetch-records.request';
import { AirtableFetchRecordsResponse } from './airtable-fetch-records.response';
import { AirtableInsertRecordsRequest } from './airtable-insert-records.request';
import { AirtableInsertRecordsResponse } from './airtable-insert-records.response';
import { AirtableProspectRecord } from './airtable-prospect.record';
import { AirtableRowInsertDto } from './airtable-row-insert.dto';
import { AirtableRowDto } from './airtable-row.dto';
import { AirtableUserRecord } from './airtable-user.record';

@Injectable()
export class AirtableService {
  private readonly logger = new Logger(AirtableService.name);

  private readonly BASE_API_URL = 'https://api.airtable.com/v0';
  private readonly BASE_APP_URL = 'https://airtable.com';
  // "Your request body should include an array of up to 10 record objects"
  // Ref: https://airtable.com/developers/web/api/create-records
  private readonly RECORDS_CHUNK_SIZE = 10;
  private readonly MAX_TRANSIENT_RETRIES = 3;
  private readonly BASE_BACKOFF_MS = 1_000;
  // "The API is limited to 5 requests per second per base"
  // https://airtable.com/developers/web/api/rate-limits
  private readonly MIN_REQUEST_INTERVAL_MS = 200;
  private readonly FETCH_TIMEOUT_MS = 30_000;

  private readonly BASE_FEEDBACK_RECORD: AirtableFeedbackRecord = {
    Date: '',
    "Origine de l'échange": 'Support et REX',
    Source: ['Support (CRISP)'],
    CR: '',
  };

  constructor(private readonly configService: ConfigurationService) {}

  async createFeedbackFromCrispSession(
    session: CrispSession,
    messages: CrispSessionMessage[],
    operator?: CrispUser
  ): Promise<{
    feedback: AirtableRowDto<AirtableFeedbackRecord>;
    created: boolean;
  }> {
    if (session.session_url) {
      this.logger.log(
        `Searching for existing feedbacks for session ${session.session_url}`
      );
      const existingFeedbacks = await this.getRecords<AirtableFeedbackRecord>(
        this.configService.get('AIRTABLE_CRM_DATABASE_ID'),
        this.configService.get('AIRTABLE_CRM_FEEDBACKS_TABLE_ID'),
        {
          filterByFormula: `SourceUrl='${session.session_url}'`,
        }
      );
      if (existingFeedbacks.records.length) {
        this.logger.log(
          `Found existing feedbacks for session ${session.session_url}`
        );
        return { feedback: existingFeedbacks.records[0], created: false };
      } else {
        this.logger.log(
          `No existing feedbacks found for session ${session.session_url}`
        );
      }
    }

    const CR = messages
      .map((message) => {
        return `${message.from}: ${message.content}`;
      })
      .join('\n');
    const lastMessage = messages.length ? messages[messages.length - 1] : null;
    const feedbackDate = lastMessage
      ? DateTime.fromMillis(lastMessage.timestamp)
      : DateTime.now();
    const feedbackDateFormatted = feedbackDate.toFormat('MM/dd/yyyy');
    const feedbackRecord: AirtableRowInsertDto<AirtableFeedbackRecord> = {
      fields: {
        ...this.BASE_FEEDBACK_RECORD,
        Date: feedbackDateFormatted,
        CR,
        SourceUrl: session.session_url,
      },
    };
    const userEmail = session.meta?.email;
    if (userEmail) {
      this.logger.log(`Searching for user ${userEmail} in Airtable`);

      const users = await this.getUsersByEmail([userEmail]);
      if (users?.length) {
        feedbackRecord.fields['Personnes'] = [users[0].id];
      }
    }

    if (operator?.email) {
      // TODO: search for airtable operators, seems not possible with the personal access token
      feedbackRecord.fields['Équipe'] = {
        email: operator.email,
      };
    }

    this.logger.log(
      `Creating feedback record: ${JSON.stringify(feedbackRecord)}`
    );

    const [createdFeedbackRecord] =
      await this.insertRecords<AirtableFeedbackRecord>(
        this.configService.get('AIRTABLE_CRM_DATABASE_ID'),
        this.configService.get('AIRTABLE_CRM_FEEDBACKS_TABLE_ID'),
        [feedbackRecord]
      );
    this.logger.log(
      `Created feedback record: ${JSON.stringify(createdFeedbackRecord)}`
    );
    return { feedback: createdFeedbackRecord, created: true };
  }

  async getUsersByEmail(emails: string[]) {
    if (!emails.length) {
      return [];
    }
    const formula =
      emails.length > 1
        ? `OR(${emails.map((email) => `email='${email}'`).join(',')})`
        : `email='${emails[0]}'`;

    this.logger.log(`Searching for user(s) ${emails.join(',')} in Airtable`);

    const users = await this.getRecords<AirtableUserRecord>(
      this.configService.get('AIRTABLE_CRM_DATABASE_ID'),
      this.configService.get('AIRTABLE_CRM_USERS_TABLE_ID'),
      {
        filterByFormula: formula,
      }
    );

    if (users.records.length) {
      this.logger.log(
        `Found user(s) in Airtable ${users.records
          .map((u) => `${u.fields.email} => ${u.id}`)
          .join(',')}`
      );
    } else {
      this.logger.warn(`User(s) ${emails.join(',')} not found in Airtable`);
    }
    return users.records;
  }

  async getProspectsByEmail(emails: string[]) {
    if (!emails.length) {
      return [];
    }
    const formula =
      emails.length > 1
        ? `OR(${emails.map((email) => `email='${email}'`).join(',')})`
        : `email='${emails[0]}'`;

    this.logger.log(
      `Searching for prospect(s) ${emails.join(',')} in Airtable`
    );

    const users = await this.getRecords<AirtableProspectRecord>(
      this.configService.get('AIRTABLE_CRM_DATABASE_ID'),
      this.configService.get('AIRTABLE_CRM_PROSPECTS_TABLE_ID'),
      {
        filterByFormula: formula,
      }
    );

    if (users.records.length) {
      this.logger.log(
        `Found prospects(s) in Airtable ${users.records
          .map((u) => `${u.fields.Email} => ${u.id}`)
          .join(',')}`
      );
    } else {
      this.logger.warn(
        `Prospects(s) ${emails.join(',')} not found in Airtable`
      );
    }
    return users.records;
  }

  async getRecords<TFields>(
    databaseId: string,
    tableIdOrName: string,
    fetchOptions?: AirtableFetchRecordsRequest
  ): Promise<AirtableFetchRecordsResponse<TFields>> {
    const url = `${this.BASE_API_URL}/${databaseId}/${tableIdOrName}/listRecords`;
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.configService.get(
        'AIRTABLE_PERSONAL_ACCESS_TOKEN'
      )}`,
    };
    const fetchResult = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(fetchOptions || {}),
    });
    const responseBody = await fetchResult.json();
    if (!fetchResult.ok) {
      this.logger.error(
        `Error getting records from Airtable: ${
          fetchResult.status
        } ${JSON.stringify(responseBody)}`
      );
      const errorResponse: AirtableErrorResponse = responseBody;
      throw new Error(
        `Error inserting records into Airtable: ${
          errorResponse?.error?.message || 'Unknown error'
        }`
      );
    } else {
      const fetchResponse: AirtableFetchRecordsResponse<TFields> = responseBody;
      this.logger.log(
        `Retrieved ${fetchResponse.records.length} records from Airtable (offset: ${fetchResponse.offset})`
      );
      fetchResponse.records?.forEach((record) => {
        record.url = `${this.BASE_APP_URL}/${databaseId}/${tableIdOrName}/${record.id}`;
      });
      return fetchResponse;
    }
  }

  async insertRecords<TFields>(
    databaseId: string,
    tableIdOrName: string,
    records: AirtableRowInsertDto<TFields>[],
    // le nom des champs utilisés pour identifier les enregistrements à mettre à jour lorsque l'id n'est pas fourni
    // (va déclencher un upsert plutôt qu'un insert)
    // passer un tableau vide dans `fieldsToMergeOn` pour faire uniquement un update
    performUpsert?: { fieldsToMergeOn: string[] }
  ): Promise<AirtableRowDto<TFields>[]> {
    const url = `${this.BASE_API_URL}/${databaseId}/${tableIdOrName}`;
    const headers = {
      Authorization: `Bearer ${this.configService.get(
        'AIRTABLE_PERSONAL_ACCESS_TOKEN'
      )}`,
      'Content-Type': 'application/json',
    };

    const resultRecords: AirtableRowDto<TFields>[] = [];

    // fait les insert/upsert par lots pour respecter la limitation de l'API
    const chunks = chunk(records, this.RECORDS_CHUNK_SIZE);
    let iChunk = 0;
    const label = performUpsert ? 'upsert' : 'insert';
    const failedRecords: AirtableRowInsertDto<TFields>[] = [];
    let lastRequestAt = 0;

    const insertChunk = async (
      chunkToInsert: AirtableRowInsertDto<TFields>[]
    ) => {
      // respecte la limite de 5 req/s d'Airtable par base
      const elapsed = Date.now() - lastRequestAt;
      if (elapsed < this.MIN_REQUEST_INTERVAL_MS) {
        await sleep(this.MIN_REQUEST_INTERVAL_MS - elapsed);
      }
      lastRequestAt = Date.now();

      const body: AirtableInsertRecordsRequest<TFields> = {
        records: chunkToInsert,
        performUpsert: performUpsert?.fieldsToMergeOn?.length
          ? performUpsert
          : undefined,
      };
      try {
        const insertResult = await fetch(url, {
          method: performUpsert ? 'PATCH' : 'POST',
          headers,
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(this.FETCH_TIMEOUT_MS),
        });
        const responseBody = await insertResult.json();
        return { insertResult, responseBody };
      } catch (err) {
        if (err instanceof DOMException && err.name === 'TimeoutError') {
          // timeout réseau — traité comme erreur transitoire par la boucle de retry
          return {
            insertResult: new Response(null, { status: 503 }),
            responseBody: {
              error: { message: `timeout after ${this.FETCH_TIMEOUT_MS}ms` },
            },
          };
        }
        throw err;
      }
    };

    for (const recordsChunk of chunks) {
      iChunk++;
      this.logger.log(
        `${label}ing chunk ${iChunk} of ${chunks.length} (${recordsChunk.length} records)`
      );

      // retente avec backoff exponentiel pour les erreurs transitoires (429, 5xx)
      let attempt = 0;
      let chunkResult = await insertChunk(recordsChunk);
      while (
        !chunkResult.insertResult.ok &&
        (chunkResult.insertResult.status === 429 ||
          chunkResult.insertResult.status >= 500)
      ) {
        if (attempt >= this.MAX_TRANSIENT_RETRIES) {
          const errorResponse: AirtableErrorResponse = chunkResult.responseBody;
          throw new Error(
            `Transient Airtable ${label} failure on chunk ${iChunk}/${
              chunks.length
            } after ${this.MAX_TRANSIENT_RETRIES} retries: ${
              errorResponse?.error?.message || 'Unknown error'
            }`
          );
        }
        const retryAfterRaw =
          chunkResult.insertResult.headers.get('Retry-After');
        const retryAfterSeconds = retryAfterRaw
          ? parseInt(retryAfterRaw, 10)
          : NaN;
        const backoffMs = !isNaN(retryAfterSeconds)
          ? retryAfterSeconds * 1_000
          : this.BASE_BACKOFF_MS * Math.pow(2, attempt);
        this.logger.warn(
          `Transient error ${
            chunkResult.insertResult.status
          } on chunk ${iChunk}/${
            chunks.length
          }, retrying in ${backoffMs}ms (attempt ${attempt + 1}/${
            this.MAX_TRANSIENT_RETRIES
          })`
        );
        await new Promise((resolve) => setTimeout(resolve, backoffMs));
        attempt++;
        chunkResult = await insertChunk(recordsChunk);
      }

      const { insertResult, responseBody } = chunkResult;

      if (insertResult.ok) {
        const insertionResponse: AirtableInsertRecordsResponse<TFields> =
          responseBody;
        this.logger.log(
          `${label}ed ${insertionResponse.records.length} records into Airtable`
        );
        insertionResponse.records?.forEach((record) => {
          record.url = `${this.BASE_APP_URL}/${databaseId}/${tableIdOrName}/${record.id}`;
        });
        resultRecords.push(...insertionResponse.records);
        continue;
      }

      this.logger.error(
        `Error ${label}ing records into Airtable: ${
          insertResult.status
        } ${JSON.stringify(responseBody)}`
      );

      // un lot peut contenir un enregistrement invalide qui fait échouer le reste (erreur 4xx)
      this.logger.warn(
        `Retrying ${recordsChunk.length} records one by one after failed chunk`
      );
      for (const record of recordsChunk) {
        const {
          insertResult: singleInsertResult,
          responseBody: singleResponseBody,
        } = await insertChunk([record]);
        if (!singleInsertResult.ok) {
          const errorResponse: AirtableErrorResponse = singleResponseBody;
          this.logger.error(
            `Skipping record after failed single ${label}: ${
              errorResponse?.error?.message || 'Unknown error'
            }, ${JSON.stringify(record)}`
          );
          failedRecords.push(record);
          continue;
        }

        const insertionResponse: AirtableInsertRecordsResponse<TFields> =
          singleResponseBody;
        insertionResponse.records?.forEach((insertedRecord) => {
          insertedRecord.url = `${this.BASE_APP_URL}/${databaseId}/${tableIdOrName}/${insertedRecord.id}`;
        });
        resultRecords.push(...insertionResponse.records);
      }
    }

    if (failedRecords.length) {
      throw new Error(
        `${failedRecords.length} record(s) could not be ${label}ed into Airtable`
      );
    }

    return resultRecords;
  }
}
