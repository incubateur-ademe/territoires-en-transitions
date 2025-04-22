/**
 * Typage (partiel) des données renvoyées par l'API Calendly
 */

export interface CalendlyUserResponse {
  resource?: { currentOrganization?: string };
}

export interface CalendlyEventTypesResponse {
  collection?: Array<{ slug: string; uri: string }>;
}

export interface CalendlyScheduledEventsResponse {
  collection?: Array<{ name: string; eventType: string; uri: string; startTime: string }>;
}

export type QuestionAndAnswer = {
  question: string;
  answer: string;
  position: number;
};

export interface CalendlyInviteesResponse {
  collection?: Array<{
    email: string;
    firstName: string | null;
    lastName: string | null;
    name: string;
    status: 'active' | 'canceled';
    questionsAndAnswers: Array<QuestionAndAnswer>;
    cancellation?: {
      canceledBy: string;
      cancelerType: 'host' | 'invitee';
      reason: string | null;
    };
  }>;
}
