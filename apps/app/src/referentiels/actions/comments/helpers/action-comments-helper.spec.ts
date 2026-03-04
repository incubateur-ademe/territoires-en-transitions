import { describe, expect, it } from 'vitest';
import { sortDiscussions } from './action-comments-helper';

describe('sortDiscussions', () => {
  type TestDiscussion = Parameters<typeof sortDiscussions>[1][number];
  type PartialMessage = Partial<TestDiscussion['messages'][number]>;
  type DiscussionOverrides = Partial<Omit<TestDiscussion, 'messages'>> & {
    messages?: PartialMessage[];
  };

  const createDiscussion = (
    overrides: DiscussionOverrides = {}
  ): TestDiscussion => {
    const discussionId = overrides.id ?? 1;
    const baseMessage = {
      id: 1,
      discussionId,
      message: 'Message',
      createdBy: 'default-user',
      createdAt: '2024-01-01T10:00:00Z',
      createdByNom: 'Nom',
      createdByPrenom: 'Prénom',
    };

    const messages = overrides.messages?.map((msg, index) => ({
      ...baseMessage,
      id: index + 1,
      ...msg,
    })) ?? [baseMessage];

    return {
      collectiviteId: 1,
      actionId: 'action-default',
      actionNom: 'Action par défaut',
      actionIdentifiant: 'A1',
      status: 'ouvert',
      createdByNom: 'default-user',
      createdAt: '2024-01-01T10:00:00Z',
      ...overrides,
      id: discussionId,
      messages: messages as TestDiscussion['messages'],
    } as TestDiscussion;
  };

  it('should return a new array preserving order when orderBy is unhandled', () => {
    const discussions = [
      createDiscussion({ actionId: 'first' }),
      createDiscussion({ actionId: 'second' }),
    ];

    const result = sortDiscussions('unknown', discussions);

    expect(result).toEqual(discussions);
    expect(result).not.toBe(discussions);
  });

  it('should sort discussions by actionId in ascending order', () => {
    const discussions = [
      createDiscussion({ actionId: 'CAE_2.1.1' }),
      createDiscussion({ actionId: 'CAE_1.1.1' }),
      createDiscussion({ actionId: 'CAE_3.1.1' }),
    ];

    const result = sortDiscussions('actionId', discussions);

    expect(result.map((discussion) => discussion.actionId)).toEqual([
      'CAE_1.1.1',
      'CAE_2.1.1',
      'CAE_3.1.1',
    ]);
  });

  it('should sort discussions by the most recent message date when ordering by createdAt', () => {
    const discussions = [
      createDiscussion({
        actionId: 'late-updated',
        createdAt: '2024-01-01T09:00:00Z',
        messages: [
          {
            message: 'Initial',
            createdAt: '2024-01-01T09:00:00Z',
            createdByNom: 'user1',
          },
          {
            message: 'Follow-up',
            createdAt: '2024-01-03T12:00:00Z',
            createdByNom: 'user2',
          },
        ],
      }),
      createDiscussion({
        actionId: 'early-updated',
        createdAt: '2024-01-02T09:00:00Z',
        messages: [
          {
            message: 'Update',
            createdAt: '2024-01-02T12:00:00Z',
            createdByNom: 'user3',
          },
        ],
      }),
      createDiscussion({
        actionId: 'no-messages',
        createdAt: '2023-01-04T09:00:00Z',
        messages: [],
      }),
    ];

    const result = sortDiscussions('createdAt', discussions);

    expect(result.map((discussion) => discussion.actionId)).toEqual([
      'late-updated',
      'early-updated',
      'no-messages',
    ]);
  });
});
