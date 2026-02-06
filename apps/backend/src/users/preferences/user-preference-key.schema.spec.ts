import {
  unflattenPreferences,
  userPreferenceKeySchema,
} from './user-preference-key.schema';

describe('userPreferenceKeySchema', () => {
  test('Valide une clé connue', () => {
    const ret = userPreferenceKeySchema.safeParse(
      'utils.notifications.isNotifyPiloteActionEnabled'
    );
    expect(ret.success).toBe(true);
  });

  test('Rejette une clé inconnue', () => {
    const ret = userPreferenceKeySchema.safeParse('cle.inconnue');
    expect(ret.success).toBe(false);
  });
});

describe('unflattenPreferences', () => {
  test('Convertit les préférences indexées par clé en objet', () => {
    const ret = unflattenPreferences({
      'utils.notifications.isNotifyPiloteActionEnabled': true,
    });
    expect(ret).toMatchObject({
      utils: {
        notifications: {
          isNotifyPiloteActionEnabled: true,
        },
      },
    });
  });
});
