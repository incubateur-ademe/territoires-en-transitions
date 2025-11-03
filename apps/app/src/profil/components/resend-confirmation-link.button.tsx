'use client';

import { useUpdateEmail } from '@/app/users/use-update-email';
import { Button, ButtonProps } from '@/ui';

type Props = ButtonProps & {
  newEmail: string;
};

export function ResendConfirmationLinkButton({ newEmail, ...props }: Props) {
  const { handleUpdateEmail, isPending } = useUpdateEmail();

  return (
    <Button
      {...props}
      onClick={() => handleUpdateEmail({ email: newEmail })}
      loading={isPending}
    >
      Renvoyer un lien de confirmation
    </Button>
  );
}
