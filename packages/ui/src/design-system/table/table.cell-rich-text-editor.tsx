import '@blocknote/core/style.css';
import DOMPurify from 'dompurify';
import { ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { uiLabels } from '../../labels/catalog';
import { cn } from '../../utils/cn';
import { Button } from '../Button';
import { Icon } from '../Icon';
import { InlineEditWrapper } from '../inline-edit';
import { RichTextEditor } from '../RichTextEditor';
import { RichTextEditorProps } from '../RichTextEditor/RichTextEditor';
import { TableCell, TableCellProps } from './table.cell';

interface TableCellRichTextEditorProps
  extends Omit<TableCellProps, 'edit' | 'children'> {
  richTextEditorProps?: RichTextEditorProps;
  initialValue?: string;
  onValueChange?: (value?: string) => void;
}

export const TableCellRichTextEditor = ({
  richTextEditorProps,
  initialValue,
  onValueChange,
  canEdit,
  className,
  ...props
}: TableCellRichTextEditorProps) => {
  const [value, setValue] = useState(initialValue);
  const sanitizedPreview = useMemo(
    () => (value ? DOMPurify.sanitize(value) : ''),
    [value]
  );

  const preview = sanitizedPreview ? (
    <RichTextPreview html={sanitizedPreview} />
  ) : null;

  if (!canEdit && sanitizedPreview) {
    return (
      <InlineEditWrapper
        renderOnEdit={({ openState }) => (
          <RichTextPopoverContent onClose={() => openState.setIsOpen(false)}>
            <div
              data-test="table.rich-text.read-only-content"
              tabIndex={0}
              className="whitespace-pre-wrap [overflow-wrap:anywhere] px-4 py-3 text-sm text-grey-8 [&_*]:leading-5 [&_p]:my-0"
              dangerouslySetInnerHTML={{ __html: sanitizedPreview }}
            />
          </RichTextPopoverContent>
        )}
      >
        <TableCell
          {...props}
          data-inline-edit="true"
          className={cn(
            '-outline-offset-2 hover:bg-primary-0 focus:bg-primary-0',
            className
          )}
        >
          {preview}
        </TableCell>
      </InlineEditWrapper>
    );
  }

  return (
    <TableCell
      canEdit={canEdit}
      className={className}
      edit={{
        onClose: () => onValueChange?.(value),
        renderOnEdit: ({ openState }) => (
          <RichTextPopoverContent onClose={() => openState.setIsOpen(false)}>
            <RichTextEditor
              autoFocus
              contentStyle={{
                size: 'sm',
              }}
              unstyled
              className="!px-4 !py-3 "
              initialValue={initialValue}
              onChange={setValue}
              OnKeyDownCapture={(event) => {
                // On ferme l'éditeur lors de l'appui sur Ctrl+Enter.
                if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
                  openState.setIsOpen(false);
                }
              }}
              {...richTextEditorProps}
            />
          </RichTextPopoverContent>
        ),
      }}
      {...props}
    >
      {preview}
    </TableCell>
  );
};

const RichTextPopoverContent = ({
  children,
  onClose,
}: {
  children: ReactNode;
  onClose: () => void;
}) => (
  <div className="relative flex min-h-0 max-w-3xl pr-10">
    <div
      data-test="table.rich-text.scroll-content"
      className="min-h-0 min-w-0 flex-1 overflow-y-auto"
    >
      {children}
    </div>
    <Button
      type="button"
      dataTest="table.rich-text.close"
      variant="unstyled"
      size="sm"
      icon="close-line"
      title={uiLabels.fermer}
      aria-label={uiLabels.fermer}
      className="absolute right-1 top-1 flex h-9 w-9 items-center justify-center rounded-md text-grey-7 hover:bg-grey-2 hover:text-grey-9"
      onClick={onClose}
    />
  </div>
);

const RichTextPreview = ({ html }: { html: string }) => {
  const previewRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [isTruncated, setIsTruncated] = useState(false);

  useEffect(() => {
    const preview = previewRef.current;
    const content = contentRef.current;
    if (!preview || !content) return;

    const measure = () =>
      setIsTruncated(preview.scrollHeight > preview.clientHeight + 1);

    measure();
    const observer =
      typeof ResizeObserver === 'undefined'
        ? null
        : new ResizeObserver(measure);
    observer?.observe(preview);
    observer?.observe(content);
    return () => observer?.disconnect();
  }, [html]);

  return (
    <div className="relative pr-8">
      <div
        ref={previewRef}
        className={cn(
          'max-h-[3lh] overflow-hidden [overflow-wrap:anywhere] leading-5 [&_*]:leading-5 [&_p]:my-0',
          // Keep BlockNote's saved markup in normal text flow in the preview.
          '[&_.bn-block]:block [&_.bn-block-content]:block',
          '[&_.bn-block-content::before]:!inline [&_.bn-inline-content]:inline'
        )}
      >
        <div ref={contentRef} dangerouslySetInnerHTML={{ __html: html }} />
      </div>
      {isTruncated && (
        <span
          role="img"
          aria-label={uiLabels.texteTronque}
          title={uiLabels.texteTronque}
          data-test="table.rich-text.truncated-indicator"
          className="absolute bottom-0 right-0 inline-flex h-5 items-center justify-center rounded border border-solid border-primary-3 bg-primary-1 px-1 text-primary-9"
        >
          <Icon icon="more-line" size="sm" aria-hidden />
        </span>
      )}
    </div>
  );
};
