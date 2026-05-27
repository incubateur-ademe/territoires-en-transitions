'use client';

import { ReactElement, ReactNode } from 'react';
import { uiLabels } from '../../labels/catalog';
import { cn } from '../../utils/cn';
import { Icon } from '../Icon';

const StatusCell = ({ done }: { done: boolean }) => (
  <td className="w-12 py-3 px-4 border-r border-grey-4 align-middle">
    <div className="flex items-center justify-center">
      <Icon
        icon={done ? 'checkbox-circle-fill' : 'close-circle-fill'}
        size="lg"
        role="img"
        aria-label={done ? uiLabels.critereAtteint : uiLabels.critereNonAtteint}
        className={done ? 'text-success' : 'text-warning-1'}
      />
    </div>
  </td>
);

const CriterionCell = ({
  label,
  action,
}: {
  label: ReactNode;
  action?: ReactElement;
}) => (
  <td className="py-3 px-4 border-r border-grey-4 align-middle">
    <div className="flex items-start justify-between gap-4">
      <div className="grow">{label}</div>
      {action && (
        <div className="shrink-0 self-start opacity-0 group-hover:opacity-100 group-focus-within:opacity-100">
          {action}
        </div>
      )}
    </div>
  </td>
);

const AnswerCell = ({ children }: { children: ReactNode }) => (
  <td className="w-1/3 py-3 px-4 align-middle text-grey-8">{children}</td>
);

export type ChecklistTableHeadProps = {
  labelHeader: string;
  answerHeader: string;
};

const HeaderCell = ({
  className,
  children,
}: {
  className?: string;
  children?: ReactNode;
}) => (
  <th
    scope="col"
    className={cn(
      'bg-grey-1 border-r border-grey-4 px-4 py-3 text-left text-sm text-grey-9 font-medium leading-none align-top',
      className
    )}
  >
    {children}
  </th>
);

const Head = ({ labelHeader, answerHeader }: ChecklistTableHeadProps) => (
  <thead>
    <tr>
      <HeaderCell className="w-12">
        <span className="sr-only">{uiLabels.statutDuCritere}</span>
      </HeaderCell>
      <HeaderCell>
        <span className="uppercase">{labelHeader}</span>
      </HeaderCell>
      <HeaderCell className="w-1/3 border-r-0">
        <span className="uppercase">{answerHeader}</span>
      </HeaderCell>
    </tr>
  </thead>
);

export type ChecklistTableRowProps = {
  done: boolean;
  criterion: {
    label: ReactNode;
    action?: ReactElement;
  };
  answer: ReactNode;
};

const Row = ({ done, criterion, answer }: ChecklistTableRowProps) => (
  <tbody>
    <tr className="group text-sm text-primary-9 hover:bg-primary-1 border-t border-grey-3">
      <StatusCell done={done} />
      <CriterionCell {...criterion} />
      <AnswerCell>{answer}</AnswerCell>
    </tr>
  </tbody>
);

export type ChecklistTableProps = {
  caption?: string;
  children: ReactNode;
  className?: string;
};

export function ChecklistTable({
  caption,
  children,
  className,
}: ChecklistTableProps) {
  return (
    <div
      className={cn(
        'border border-grey-4 rounded-md overflow-x-auto',
        className
      )}
    >
      <table className="min-w-[640px] w-full bg-white table-fixed">
        {caption && <caption className="sr-only">{caption}</caption>}
        {children}
      </table>
    </div>
  );
}

ChecklistTable.Head = Head;
ChecklistTable.Row = Row;
