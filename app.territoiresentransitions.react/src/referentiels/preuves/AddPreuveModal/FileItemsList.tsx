import {FileItem, TFileItem} from './FileItem';
import {UploadStatus, UploadStatusCode} from './types';

export type TFileItemsListProps = {
  items: Array<TFileItem>;
  /** Pour notifier de la sortie de l'état "running" */
  onRunningStopped: (fileName: string, status: UploadStatus) => void;
  /** Pour supprimer un item de la liste "failed" */
  onRemoveFailed?: (fileName: string) => void;
};

/**
 * Affiche la liste des fichiers uploadés/en cours d'upload/en erreur
 */
export const FileItemsList = (props: TFileItemsListProps) => {
  const {items, onRunningStopped, onRemoveFailed} = props;

  // groupe les items terminés/en cours/en erreur
  const {completed, running, failed, duplicated} = items.reduce(
    groupByStatus,
    emptyGroups
  );

  // et rend chaque groupe d'items
  return (
    <div
      data-test="FileItems"
      className="overflow-y-auto max-h-[220px] flex flex-col gap-3"
    >
      {renderItems(completed)}
      {renderItems(duplicated, {onRemoveFailed})}
      {renderItems(running, {onRunningStopped})}
      {renderItems(failed, {onRemoveFailed})}
    </div>
  );
};

// rendu des items
const renderItems = (items: Array<TFileItem>, props?: {}) =>
  items.length ? (
    <div className="flex flex-col gap-3">
      {items.map(item => (
        <FileItem key={item.file.name} {...item} {...props} />
      ))}
    </div>
  ) : null;

// pour grouper les items terminés/en cours/en erreur
type TGroupedItems = {
  completed: Array<TFileItem>;
  running: Array<TFileItem>;
  failed: Array<TFileItem>;
  duplicated: Array<TFileItem>;
};
const emptyGroups: TGroupedItems = {
  completed: [],
  running: [],
  failed: [],
  duplicated: [],
};

const groupByStatus = (
  result: TGroupedItems,
  item: TFileItem
): TGroupedItems => {
  const {status} = item;
  switch (status.code) {
    case UploadStatusCode.completed:
    case UploadStatusCode.duplicated:
    case UploadStatusCode.running:
    case UploadStatusCode.failed:
      return {...result, [status.code]: [...result[status.code], item]};
    default:
      return result;
  }
};
