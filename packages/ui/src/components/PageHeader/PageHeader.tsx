'use client';

import {
  Children,
  isValidElement,
  JSX,
  ReactElement,
  ReactNode,
  useId,
} from 'react';

import { Divider } from '../../design-system/Divider';
import { cn } from '../../utils/cn';
import {
  EditableTitle as EditableTitlePrimitive,
  EditableTitleProps,
} from './EditableTitle';
import {
  PageHeaderContext,
  usePageHeaderContext,
} from './page-header.context';

type TitleProps = { children: ReactNode; className?: string };

const Title = ({ children, className }: TitleProps): JSX.Element => {
  const { titleId, compact } = usePageHeaderContext();
  return (
    <div className="flex-1">
      <h1
        id={titleId}
        className={cn(
          'mb-0 leading-tight',
          compact ? 'text-xl' : 'text-2xl',
          className
        )}
      >
        {children}
      </h1>
    </div>
  );
};
Title.displayName = 'PageHeader.Title';

type EditableTitleSlotProps = Omit<EditableTitleProps, 'titleId' | 'compact'>;

const EditableTitle = (props: EditableTitleSlotProps): JSX.Element => {
  const { titleId, compact } = usePageHeaderContext();
  return (
    <div className="flex-1">
      <EditableTitlePrimitive {...props} titleId={titleId} compact={compact} />
    </div>
  );
};
EditableTitle.displayName = 'PageHeader.EditableTitle';

const Actions = ({ children }: { children: ReactNode }): JSX.Element => (
  <div>{children}</div>
);
Actions.displayName = 'PageHeader.Actions';

const Subtitle = ({ children }: { children: ReactNode }): JSX.Element => (
  <div>{children}</div>
);
Subtitle.displayName = 'PageHeader.Subtitle';

type MetadataProps = { children: ReactNode; visibleWhen?: boolean };

const Metadata = ({
  children,
  visibleWhen = true,
}: MetadataProps): JSX.Element | null => {
  if (!visibleWhen) return null;
  return <div className="flex flex-col gap-2">{children}</div>;
};
Metadata.displayName = 'PageHeader.Metadata';

type NavigationProps = { children: ReactNode; label: string };

const Navigation = ({ children, label }: NavigationProps): JSX.Element => (
  <nav aria-label={label}>{children}</nav>
);
Navigation.displayName = 'PageHeader.Navigation';

type PageHeaderProps = {
  children: ReactNode;
  className?: string;
  dataTest?: string;
  compact?: boolean;
};

const isTitleSlot = (slot: ReactElement): boolean =>
  slot.type === Title || slot.type === EditableTitle;

const isActiveMetadataSlot = (slot: ReactElement): boolean => {
  if (slot.type !== Metadata) return false;
  const props = slot.props as MetadataProps;
  return props.visibleWhen !== false;
};

export const PageHeader = ({
  children,
  className,
  dataTest,
  compact = false,
}: PageHeaderProps): JSX.Element => {
  const titleId = useId();
  const slots = Children.toArray(children).filter(isValidElement);
  const navigation = slots.find((slot) => slot.type === Navigation);
  const title = slots.find(isTitleSlot);
  const actions = slots.find((slot) => slot.type === Actions);
  const subtitle = slots.find((slot) => slot.type === Subtitle);
  const metadataRows = slots.filter(isActiveMetadataSlot);

  const dividers = metadataRows.flatMap((row, index) => [
    <Divider key={`d-${index}`} color="grey" aria-hidden />,
    row,
  ]);

  return (
    <PageHeaderContext.Provider value={{ titleId, compact }}>
      <section
        aria-labelledby={title !== undefined ? titleId : undefined}
        data-test={dataTest}
        className={cn(
          'flex flex-col gap-2 w-full mb-4',
          compact && 'gap-1 py-2 border-b border-primary-3 bg-grey-2 mb-0',
          className
        )}
      >
        {navigation}
        <div className="flex flex-row items-center gap-4">
          {title}
          {actions}
        </div>
        {subtitle}
        {dividers}
        {!compact && <Divider color="primary" aria-hidden />}
      </section>
    </PageHeaderContext.Provider>
  );
};

PageHeader.Title = Title;
PageHeader.EditableTitle = EditableTitle;
PageHeader.Actions = Actions;
PageHeader.Subtitle = Subtitle;
PageHeader.Metadata = Metadata;
PageHeader.Navigation = Navigation;
