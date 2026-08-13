'use client';

import { ReactElement, ReactNode, createContext, useContext } from 'react';
import { uiLabels } from '../../labels/catalog';
import { cn } from '../../utils/cn';
import { Icon } from '../Icon';

type ChecklistTableContextValue = {
  /** Active une colonne dédiée (ex. badge/étiquette) après la colonne statut. */
  hasTagColumn: boolean;
};

const ChecklistTableContext = createContext<ChecklistTableContextValue>({
  hasTagColumn: false,
});

const StatusCell = ({ done }: { done: boolean | null }) => (
  <td className="w-12 py-3 px-4 border-r border-grey-4 align-middle">
    {done !== null && (
      <div className="flex items-center justify-center">
        <Icon
          icon={done ? 'checkbox-circle-fill' : 'close-circle-fill'}
          size="lg"
          role="img"
          aria-label={
            done ? uiLabels.critereAtteint : uiLabels.critereNonAtteint
          }
          className={done ? 'text-success' : 'text-warning-1'}
        />
      </div>
    )}
  </td>
);

const TagCell = ({ children }: { children: ReactNode }) => (
  <td className="w-40 py-3 px-4 border-r border-grey-4 align-middle">
    {children}
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
    <div className="flex items-center justify-between gap-4">
      <div className="grow">{label}</div>
      {action && (
        <div className="shrink-0 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100">
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
  /**
   * Libellé de la colonne d’étiquette optionnelle. Requis (au moins pour
   * l’accessibilité) lorsque la table est configurée avec `hasTagColumn`.
   */
  tagHeader?: string;
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

const Head = ({
  labelHeader,
  answerHeader,
  tagHeader,
}: ChecklistTableHeadProps) => {
  const { hasTagColumn } = useContext(ChecklistTableContext);

  return (
    <thead>
      <tr>
        <HeaderCell className="w-12">
          <span className="sr-only">{uiLabels.statutDuCritere}</span>
        </HeaderCell>
        {hasTagColumn && (
          <HeaderCell className="w-40">
            {tagHeader ? (
              <span className="uppercase">{tagHeader}</span>
            ) : (
              <span className="sr-only">{uiLabels.etiquette}</span>
            )}
          </HeaderCell>
        )}
        <HeaderCell>
          <span className="uppercase">{labelHeader}</span>
        </HeaderCell>
        <HeaderCell className="w-1/3 border-r-0">
          <span className="uppercase">{answerHeader}</span>
        </HeaderCell>
      </tr>
    </thead>
  );
};

export type ChecklistTableRowProps = {
  /**
   * `null` : la ligne n'affiche aucun statut. Pour un critère facultatif non
   * renseigné, l'absence de réponse n'est pas un manque à signaler.
   */
  done: boolean | null;
  criterion: {
    label: ReactNode;
    action?: ReactElement;
  };
  answer: ReactNode;
  /** Contenu de la colonne d’étiquette optionnelle (si `hasTagColumn`). */
  tag?: ReactNode;
};

const Row = ({ done, criterion, answer, tag }: ChecklistTableRowProps) => {
  const { hasTagColumn } = useContext(ChecklistTableContext);

  return (
    <tbody>
      <tr className="group text-sm text-primary-9 hover:bg-primary-1 border-t border-grey-3">
        <StatusCell done={done} />
        {hasTagColumn && <TagCell>{tag}</TagCell>}
        <CriterionCell {...criterion} />
        <AnswerCell>{answer}</AnswerCell>
      </tr>
    </tbody>
  );
};

export type ChecklistTableProps = {
  caption?: string;
  children: ReactNode;
  className?: string;
  /**
   * Ajoute une colonne d’étiquette dédiée juste après la colonne de statut.
   * Alimentée par `tagHeader` sur `ChecklistTable.Head` et `tag` sur
   * `ChecklistTable.Row`.
   */
  hasTagColumn?: boolean;
};

export function ChecklistTable({
  caption,
  children,
  className,
  hasTagColumn = false,
}: ChecklistTableProps) {
  return (
    <ChecklistTableContext.Provider value={{ hasTagColumn }}>
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
    </ChecklistTableContext.Provider>
  );
}

ChecklistTable.Head = Head;
ChecklistTable.Row = Row;
