import { ReactElement, ReactNode } from 'react';

export const AnswerStack = ({
  children,
}: {
  children: ReactNode;
}): ReactElement => <div className="flex flex-col gap-3">{children}</div>;
