import { fireEvent, render, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { VerifyOTP } from './verify-otp';

// useEventTracker requiert un contexte PostHog absent en environnement de test :
// on le remplace par une fonction no-op pour éviter l'erreur de contexte.
vi.mock('@tet/ui', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tet/ui')>();
  return { ...actual, useEventTracker: () => vi.fn() };
});

const noop = vi.fn();

describe('VerifyOTP', () => {
  it('la soumission avec un OTP valide (6 chiffres) appelle onSubmit avec email + code', async () => {
    const onSubmit = vi.fn();

    const { container } = render(
      <VerifyOTP
        type="login"
        defaultValues={{ email: 'test@example.com', otp: '123456' }}
        error={null}
        onSubmit={onSubmit}
        onCancel={noop}
        onResend={noop}
      />
    );

    const submitButton = await waitFor(() => {
      const button = container.querySelector(
        '[data-test="auth.verify-otp.valider-button"]'
      );
      if (!(button instanceof HTMLButtonElement)) {
        throw new Error('bouton Valider introuvable');
      }
      expect(button.disabled).toBe(false);
      return button;
    });

    fireEvent.click(submitButton);

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0][0]).toEqual({
      email: 'test@example.com',
      otp: '123456',
    });
  });
});
