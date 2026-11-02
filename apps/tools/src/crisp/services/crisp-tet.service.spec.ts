import { Test } from '@nestjs/testing';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import ConfigurationService from '../../config/configuration.service';
import { TrpcClientService } from '../../utils/trpc/trpc-client.service';
import { CrispTetService } from './crisp-tet.service';

const getMessagesInConversation = vi.fn();
const getWebsiteOperator = vi.fn();
const getConversation = vi.fn();
const sendMessageInConversation = vi.fn();

vi.mock('crisp-api', () => ({
  default: class {
    authenticateTier = vi.fn();
    website = {
      getMessagesInConversation,
      getWebsiteOperator,
      getConversation,
      sendMessageInConversation,
    };
  },
}));

const askFromCrisp = vi.fn();

const buildService = async () => {
  const module = await Test.createTestingModule({
    providers: [
      CrispTetService,
      { provide: ConfigurationService, useValue: { get: vi.fn() } },
      {
        provide: TrpcClientService,
        useValue: {
          getClient: () => ({
            assistant: { askFromCrisp: { mutate: askFromCrisp } },
          }),
        },
      },
    ],
  }).compile();
  return module.get(CrispTetService);
};

const notes = () =>
  sendMessageInConversation.mock.calls.map(([, , note]) => note.content);

describe('CrispTetService', () => {
  beforeEach(() => {
    getMessagesInConversation.mockReset().mockResolvedValue([
      { fingerprint: 1, from: 'user', type: 'text', content: 'Je bloque' },
      {
        fingerprint: 2,
        from: 'operator',
        type: 'note',
        content: '/tet pourquoi ?',
        user: { user_id: 'op-1' },
      },
    ]);
    getWebsiteOperator
      .mockReset()
      .mockResolvedValue({ email: 'support@tet.fr' });
    getConversation
      .mockReset()
      .mockResolvedValue({ meta: { email: 'agent@ville.fr' } });
    sendMessageInConversation.mockReset().mockResolvedValue({});
    askFromCrisp.mockReset().mockResolvedValue({
      answer: 'Il manque la pièce EES.',
      toolCalls: [{ name: 'get_demarche_pcaet' }],
      durationMs: 8_000,
      model: 'gpt-oss-120b',
    });
  });

  test('note d’attente, appel de l’assistant avec le contexte, note de réponse', async () => {
    const service = await buildService();

    await service.handleTetRequest('website', 'session', 2);

    expect(getWebsiteOperator).toHaveBeenCalledWith('website', 'op-1');
    expect(askFromCrisp).toHaveBeenCalledWith({
      operatorEmail: 'support@tet.fr',
      question: 'pourquoi ?',
      visitorEmail: 'agent@ville.fr',
      visitorMessages: ['Je bloque'],
      history: [],
    });
    expect(notes()).toEqual([
      '🔎 /tet : je cherche…',
      expect.stringContaining('Il manque la pièce EES.'),
    ]);
  });

  test('note introuvable par l’API : rien n’est envoyé', async () => {
    const service = await buildService();

    await service.handleTetRequest('website', 'session', 999);

    expect(askFromCrisp).not.toHaveBeenCalled();
    expect(sendMessageInConversation).not.toHaveBeenCalled();
  });

  test('refus de l’assistant : une note dit pourquoi', async () => {
    askFromCrisp.mockRejectedValue(
      new Error(
        "Le compte Territoires en Transitions de cet opérateur n'a pas le rôle support"
      )
    );
    const service = await buildService();

    await service.handleTetRequest('website', 'session', 2);

    expect(notes().at(-1)).toContain("n'a pas le rôle support");
  });
});
