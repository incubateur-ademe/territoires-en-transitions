import { AirtableErrorResponse } from '@/tools-automation-api/airtable/airtable-error.response';
import { AirtableFeedbackRecord } from '@/tools-automation-api/airtable/airtable-feedback.record';
import { AirtableFetchRecordsRequest } from '@/tools-automation-api/airtable/airtable-fetch-records.request';
import { AirtableFetchRecordsResponse } from '@/tools-automation-api/airtable/airtable-fetch-records.response';
import { AirtableInsertRecordsRequest } from '@/tools-automation-api/airtable/airtable-insert-records.request';
import { AirtableInsertRecordsResponse } from '@/tools-automation-api/airtable/airtable-insert-records.response';
import { AirtableRowInsertDto } from '@/tools-automation-api/airtable/airtable-row-insert.dto';
import { AirtableRowDto } from '@/tools-automation-api/airtable/airtable-row.dto';
import { AirtableUserRecord } from '@/tools-automation-api/airtable/airtable-user.record';
import ConfigurationService from '@/tools-automation-api/config/configuration.service';
import {
  CrispSessionMessage,
  CrispUser,
} from '@/tools-automation-api/crisp/models/get-crisp-session-messages.response';
import { CrispSession } from '@/tools-automation-api/crisp/models/get-crisp-session.response';
import { Injectable, Logger } from '@nestjs/common';
import { DateTime } from 'luxon';

@Injectable()
export class AirtableService {
  private readonly logger = new Logger(AirtableService.name);

  private readonly BASE_API_URL = 'https://api.airtable.com/v0';
  private readonly BASE_APP_URL = 'https://airtable.com';

  private readonly BASE_FEEDBACK_RECORD: AirtableFeedbackRecord = {
    Date: '',
    "Origine de l'échange": 'Support et REX',
    Source: ['Support'],
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

      const users = await this.getRecords<AirtableUserRecord>(
        this.configService.get('AIRTABLE_CRM_DATABASE_ID'),
        this.configService.get('AIRTABLE_CRM_USERS_TABLE_ID'),
        {
          filterByFormula: `email='${userEmail}'`,
        }
      );
      if (users.records.length) {
        this.logger.log(
          `Found user ${userEmail} in Airtable with id ${users.records[0].id}`
        );
        feedbackRecord.fields['Personnes'] = [users.records[0].id];
      } else {
        this.logger.warn(`User ${userEmail} not found in Airtable`);
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
    records: AirtableRowInsertDto<TFields>[]
  ): Promise<AirtableRowDto<TFields>[]> {
    const url = `${this.BASE_API_URL}/${databaseId}/${tableIdOrName}`;
    const headers = {
      Authorization: `Bearer ${this.configService.get(
        'AIRTABLE_PERSONAL_ACCESS_TOKEN'
      )}`,
      'Content-Type': 'application/json',
    };

    const body: AirtableInsertRecordsRequest<TFields> = {
      records,
    };

    const insertResult = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
    const responseBody = await insertResult.json();
    if (!insertResult.ok) {
      this.logger.error(
        `Error inserting records into Airtable: ${
          insertResult.status
        } ${JSON.stringify(responseBody)}`
      );
      const errorResponse: AirtableErrorResponse = responseBody;
      throw new Error(
        `Error inserting records into Airtable: ${
          errorResponse?.error?.message || 'Unknown error'
        }`
      );
    } else {
      const insertionResponse: AirtableInsertRecordsResponse<TFields> =
        responseBody;
      this.logger.log(
        `Inserted ${insertionResponse.records.length} records into Airtable`
      );
      insertionResponse.records?.forEach((record) => {
        record.url = `${this.BASE_APP_URL}/${databaseId}/${tableIdOrName}/${record.id}`;
      });
      return insertionResponse.records;
    }
  }
}
