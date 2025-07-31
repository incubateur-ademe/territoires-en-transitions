import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { keyBy } from 'es-toolkit';
import { DateTime, DurationLike } from 'luxon';
import { objectToCamel, objectToSnake } from 'ts-case-convert';
import ConfigurationService from '../config/configuration.service';
import {
  CalendlyEventTypesResponse,
  CalendlyInviteesResponse,
  CalendlyScheduledEventsResponse,
  CalendlyUserResponse,
  QuestionAndAnswer,
} from './calendy-api.dto';
import { DemoSessionSlugs } from './demo-sessions';

const NextSessionInOneHour: DurationLike = { hours: 1 };

type SessionsAndInvitees = Awaited<
  ReturnType<CalendlyApiService['getNextSessionsAndInvitees']>
>;
type Session = NonNullable<SessionsAndInvitees>[number];
export type Invitee = NonNullable<Session['invitees']>[number];

@Injectable()
export class CalendlyApiService {
  private readonly API_URL = 'https://api.calendly.com';
  private readonly logger = new Logger(CalendlyApiService.name);
  private readonly headers = {
    'content-type': 'application/json',
    authorization: `Bearer ${this.configurationService.get(
      'CALENDLY_ACCESS_TOKEN'
    )}`,
  };

  constructor(private readonly configurationService: ConfigurationService) {}

  /**
   * Récupère les sessions de démo sur le point de démarrer (d'ici 1h par
   * défaut) et la liste des inscrits à chacune
   */
  async getNextSessionsAndInvitees(
    duration: DurationLike = NextSessionInOneHour
  ) {
    this.logger.log(
      `Calendly: récupère les sessions de démo sur le point de démarrer dans (${JSON.stringify(
        duration
      )})`
    );
    const organizationURI = await this.getOrganizationURI();
    if (!organizationURI) {
      throw new NotFoundException('Calendly: organisation non trouvée');
    }

    const eventTypes = await this.getDemoSessionEventTypes(organizationURI);
    if (!eventTypes?.length) {
      throw new NotFoundException(
        `Calendly: les types de session voulus n'ont pas été trouvé`
      );
    }

    const eventTypesURIs = eventTypes.map((eventType) => eventType.uri);
    const nextSessionEvents = await this.getNextSessionEvents(
      organizationURI,
      eventTypesURIs,
      duration
    );
    if (!nextSessionEvents?.length) {
      this.logger.log('Calendly: aucune session sur le point de démarrer');
    }

    const eventTypeByUri = keyBy(eventTypes, (eventType) => eventType.uri);
    return nextSessionEvents
      ? Promise.all(
          nextSessionEvents.map(async (session) => {
            const invitees = await this.getSessionDemoInvitees(session.uri);
            return {
              eventType: eventTypeByUri[session.eventType],
              session,
              invitees,
            };
          })
        )
      : undefined;
  }

  /** Récupère l'uri de l'organisation */
  async getOrganizationURI() {
    const response = await this.getData<CalendlyUserResponse>('users/me');
    return response?.resource?.currentOrganization;
  }

  /** Récupère le type associé à chaque session de démo */
  async getDemoSessionEventTypes(organizationURI: string) {
    const response = await this.getData<CalendlyEventTypesResponse>(
      'event_types',
      {
        organization: organizationURI,
        status: 'active',
      }
    );
    return response?.collection?.filter((eventType) =>
      DemoSessionSlugs.includes(eventType.slug)
    );
  }

  /**
   * Récupère les prochaines sessions de démo sur le point de démarrer (dans 1h
   * par défaut) et qui correspondent à un des types d'événements attendus.
   */
  async getNextSessionEvents(
    organizationURI: string,
    eventTypesURIs: string[],
    duration: DurationLike = NextSessionInOneHour
  ) {
    const now = DateTime.now();
    const minStartTime = now.toUTC().toString();
    const maxStartTime = now.plus(duration).toUTC().toString();
    const response = await this.getData<CalendlyScheduledEventsResponse>(
      'scheduled_events',
      {
        organization: organizationURI,
        minStartTime,
        maxStartTime,
        status: 'active',
      }
    );
    return response?.collection?.filter((event) =>
      eventTypesURIs.includes(event.eventType)
    );
  }

  /** Récupère les inscrits à une session de démo */
  async getSessionDemoInvitees(sessionUri: string) {
    const response = await this.getData<CalendlyInviteesResponse>(
      `${sessionUri}/invitees`
    );
    return response?.collection?.map((invitee) => {
      const questionsAndAnswers = this.parseQuestionAndAnswer(
        invitee.questionsAndAnswers
      );

      return {
        ...invitee,
        ...questionsAndAnswers,
      };
    });
  }

  /**
   * Fait un appel GET à l'API
   *
   * Assure la conversion des paramètes donnés en snake_case et de la réponse
   * reçue en camelCase.
   */
  private async getData<ResponseType>(
    endpoint: string,
    params?: Record<string, string>
  ) {
    const url = endpoint.startsWith('https://')
      ? endpoint
      : `${this.API_URL}/${endpoint}`;
    const searchParams = params
      ? `?${new URLSearchParams(objectToSnake(params)).toString()}`
      : '';
    this.logger.log(`Calendly: GET ${endpoint}${searchParams}`);

    const response = await fetch(url + searchParams, { headers: this.headers });
    const body = await response.json();
    if (!response.ok) {
      this.logger.log(
        `Calendly: erreur ${JSON.stringify(body)} (${response.status}: ${
          response.statusText
        })`
      );
      return null;
    }

    return objectToCamel(body) as ResponseType;
  }

  /**
   * Fait le mapping entre le libellé variable des questions et une clé constante
   */
  parseQuestionAndAnswer(qr: Array<QuestionAndAnswer>) {
    const answerByKey = new Map<ValidKeys, string>();
    qr.forEach(({ question, answer }) => {
      const key = QuestionToKey.find((q) => question.match(q.re))?.key;
      if (key) {
        answerByKey.set(key, answer);
      }
    });

    return Object.fromEntries(answerByKey.entries()) as Record<
      ValidKeys,
      string | undefined
    >;
  }
}

// pour faire le mapping entre le libellé (variable) des questions et une clé constante
const QuestionToKey = [
  { re: /collectivité/i, key: 'collectivite' },
  { re: /fonction/i, key: 'fonction' },
  { re: /téléphone/i, key: 'telephone' },
  { re: /comment/i, key: 'decouvertePF' },
  { re: /pourquoi/i, key: 'raisonsInscription' },
] as const;
type ValidKeys = (typeof QuestionToKey)[number]['key'];
