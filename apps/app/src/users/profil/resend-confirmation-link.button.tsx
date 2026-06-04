'use client';

import { useUpdateEmail } from '@/app/users/use-update-email';
import { Button, ButtonProps } from '@tet/ui';
import { appLabels } from '@/app/labels/catalog';

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
      {appLabels.renvoyerLienConfirmation}
    </Button>
  );
}
