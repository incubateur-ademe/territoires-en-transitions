import { DetailedAction } from '@/app/ui/detailed-action/detailed-action.layout';
import type { JSX, ReactNode } from 'react';

export const FormSection = ({
  title,
  children,
}: {
  readonly title?: string;
  readonly children: ReactNode;
}): JSX.Element => (
  <DetailedAction.Section title={title}>
    <form className="flex flex-col gap-4">{children}</form>
  </DetailedAction.Section>
);
