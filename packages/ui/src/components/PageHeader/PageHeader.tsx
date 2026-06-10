'use client';

import {
  Children,
  isValidElement,
  JSX,
  ReactElement,
  ReactNode,
  RefObject,
  useEffect,
  useId,
  useRef,
} from 'react';

import { Divider } from '../../design-system/Divider';
import { cn } from '../../utils/cn';
import {
  EditableTitle as EditableTitlePrimitive,
  EditableTitleProps,
} from './EditableTitle';
import { PageHeaderContext, usePageHeaderContext } from './page-header.context';
import { useStickyHeaderHeightSetter } from './sticky-header-height.context';
import { useSticky } from './use-sticky';

type TitleProps = { children: ReactNode; className?: string };

const Title = ({ children, className }: TitleProps): JSX.Element => {
  const { titleId, compact } = usePageHeaderContext();
  return (
    <div className="flex-1">
      <h1
        id={titleId}
        className={cn(
          'mb-0 !leading-tight',
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
  sticky?: boolean;
  onStickyChange?: (isSticky: boolean) => void;
};

const isTitleSlot = (slot: ReactElement): boolean =>
  slot.type === Title || slot.type === EditableTitle;

const isActiveMetadataSlot = (slot: ReactElement): boolean => {
  if (slot.type !== Metadata) return false;
  const props = slot.props as MetadataProps;
  return props.visibleWhen !== false;
};

function useStickyChangeCallback(
  isSticky: boolean,
  onStickyChange: ((isSticky: boolean) => void) | undefined
): void {
  const onStickyChangeRef = useRef(onStickyChange);
  useEffect(() => {
    onStickyChangeRef.current = onStickyChange;
  });
  useEffect(() => {
    onStickyChangeRef.current?.(isSticky);
  }, [isSticky]);
}

type StickyContainerProps = {
  sentinelRef: RefObject<HTMLDivElement | null>;
  headerRef: RefObject<HTMLDivElement | null>;
  minHeight: number | undefined;
  children: ReactNode;
};

const StickyContainer = ({
  sentinelRef,
  headerRef,
  minHeight,
  children,
}: StickyContainerProps): JSX.Element => {
  const setContentRef = useStickyHeaderHeightSetter();
  return (
    <>
      <div ref={sentinelRef} aria-hidden className="h-px -mb-px" />
      <div
        ref={headerRef}
        style={{ minHeight }}
        className="flow-root sticky top-0 z-sticky-header pointer-events-none"
      >
        <div ref={setContentRef} className="pointer-events-auto">
          {children}
        </div>
      </div>
    </>
  );
};

export const PageHeader = ({
  children,
  className,
  dataTest,
  compact = false,
  sticky = false,
  onStickyChange,
}: PageHeaderProps): JSX.Element => {
  const titleId = useId();
  const { isSticky, sentinelRef, headerRef, pinnedMinHeight } =
    useSticky(sticky);
  useStickyChangeCallback(isSticky, onStickyChange);

  const isCompact = compact || isSticky;

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

  const section = (
    <PageHeaderContext.Provider value={{ titleId, compact: isCompact }}>
      <section
        aria-labelledby={title !== undefined ? titleId : undefined}
        data-test={dataTest}
        className={cn(
          'flex flex-col gap-2 w-full mb-4',
          isCompact && 'gap-1 py-2 border-b border-primary-3 bg-grey-2 mb-0',
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
        {!isCompact && <Divider color="primary" aria-hidden />}
      </section>
    </PageHeaderContext.Provider>
  );

  if (!sticky) return section;

  return (
    <StickyContainer
      sentinelRef={sentinelRef}
      headerRef={headerRef}
      minHeight={pinnedMinHeight}
    >
      {section}
    </StickyContainer>
  );
};

PageHeader.Title = Title;
PageHeader.EditableTitle = EditableTitle;
PageHeader.Actions = Actions;
PageHeader.Subtitle = Subtitle;
PageHeader.Metadata = Metadata;
PageHeader.Navigation = Navigation;
