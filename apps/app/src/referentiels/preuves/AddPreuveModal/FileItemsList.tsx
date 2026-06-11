import { VisibleWhen } from '@tet/ui';
import { groupBy } from 'es-toolkit';
import { JSX } from 'react';
import { FileItem, TFileItem } from './FileItem';
import { UploadStatus, UploadStatusCode } from './types';

const ItemGroup = ({
  items,
  onStatusChange,
  onDismissItem,
}: {
  items: Array<TFileItem>;
  onStatusChange?: (fileName: string, status: UploadStatus) => void;
  onDismissItem?: (fileName: string) => void;
}): JSX.Element => (
  <div className="flex flex-col gap-3">
    {items.map((item) => (
      <FileItem
        key={item.file.name}
        {...item}
        onStatusChange={onStatusChange}
        onDismissItem={onDismissItem}
      />
    ))}
  </div>
);

export type FileItemsListProps = {
  items: Array<TFileItem>;
  onStatusChange: (fileName: string, status: UploadStatus) => void;
  onDismissItem?: (fileName: string) => void;
};

export const FileItemsList = ({
  items,
  onStatusChange,
  onDismissItem,
}: FileItemsListProps): JSX.Element => {
  const grouped = groupBy(items, (item) => item.status.code);
  const completed = grouped[UploadStatusCode.completed] ?? [];
  const duplicated = grouped[UploadStatusCode.duplicated] ?? [];
  const running = grouped[UploadStatusCode.running] ?? [];
  const failed = grouped[UploadStatusCode.failed] ?? [];

  return (
    <div
      data-test="FileItems"
      className="overflow-y-auto max-h-[220px] flex flex-col gap-3"
    >
      <VisibleWhen condition={completed.length > 0}>
        <ItemGroup items={completed} />
      </VisibleWhen>
      <VisibleWhen condition={duplicated.length > 0}>
        <ItemGroup items={duplicated} onDismissItem={onDismissItem} />
      </VisibleWhen>
      <VisibleWhen condition={running.length > 0}>
        <ItemGroup items={running} onStatusChange={onStatusChange} />
      </VisibleWhen>
      <VisibleWhen condition={failed.length > 0}>
        <ItemGroup items={failed} onDismissItem={onDismissItem} />
      </VisibleWhen>
    </div>
  );
};
