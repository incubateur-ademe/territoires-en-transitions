import { SharedFicheLinkedResourcesAlert } from '@/app/plans/fiches/share-fiche/shared-fiche-linked-resources.alert';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { FicheWithRelations } from '@tet/domain/plans';
import { EmptyCard } from '@tet/ui';
import {
  Children,
  ComponentProps,
  isValidElement,
  JSX,
  ReactNode,
} from 'react';

type AlertProps = {
  title: string;
  description: string;
  fiche: FicheWithRelations;
  collectiviteId: number;
};

type EmptyProps = Omit<
  ComponentProps<typeof EmptyCard>,
  'size' | 'variant' | 'isReadonly'
> & { isReadonly: boolean };

type ContentProps<T> = {
  data: T[];
  isLoading?: boolean;
  actions?: ReactNode;
  children: ((item: T) => ReactNode) | JSX.Element;
};

const SharedAlert = (_props: AlertProps) => null;
const Empty = (_props: EmptyProps) => null;
const Content = <T,>(_props: ContentProps<T>) => null;

SharedAlert.displayName = 'ContentLayout.SharedAlert';
Empty.displayName = 'ContentLayout.Empty';
Content.displayName = 'ContentLayout.Content';

const extractProps = (children: ReactNode) => {
  const { alertProps, emptyProps, contentProps } = Children.toArray(children)
    .filter(isValidElement)
    .reduce<{
      alertProps?: AlertProps;
      emptyProps?: EmptyProps;
      contentProps?: ContentProps<unknown>;
    }>((acc, child) => {
      const displayName = (child.type as { displayName?: string }).displayName;

      if (displayName === SharedAlert.displayName) {
        return { ...acc, alertProps: child.props as AlertProps };
      }
      if (displayName === Empty.displayName) {
        return { ...acc, emptyProps: child.props as EmptyProps };
      }
      if (displayName === Content.displayName) {
        return { ...acc, contentProps: child.props as ContentProps<unknown> };
      }
      return acc;
    }, {});
  return { alertProps, emptyProps, contentProps };
};

function Root({ children }: { children: ReactNode }) {
  const { alertProps, emptyProps, contentProps } = extractProps(children);
  const { isLoading = false, data } = contentProps || {};
  const isEmpty = !data || data.length === 0;

  const renderBody = () => {
    if (isLoading) {
      return (
        <div className="h-[24rem] flex">
          <SpinnerLoader className="m-auto" />
        </div>
      );
    }

    if (isEmpty && emptyProps) {
      return (
        <EmptyCard
          {...emptyProps}
          size="md"
          variant="transparent"
          isReadonly={emptyProps.isReadonly}
        />
      );
    }

    if (data && contentProps) {
      const isRenderFunction = typeof contentProps.children === 'function';
      const renderFn = isRenderFunction
        ? (contentProps.children as (item: unknown) => ReactNode)
        : null;

      return (
        <>
          {contentProps.actions && (
            <div className="flex justify-end gap-2 mb-6">
              {contentProps.actions}
            </div>
          )}
          {isRenderFunction && renderFn ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-6">
              {data.map((item, index) => (
                <div key={index}>{renderFn(item)}</div>
              ))}
            </div>
          ) : (
            contentProps.children
          )}
        </>
      );
    }

    return null;
  };

  return (
    <div className="bg-white p-7 rounded-[10px]">
      {alertProps && (
        <SharedFicheLinkedResourcesAlert
          fiche={alertProps.fiche}
          currentCollectiviteId={alertProps.collectiviteId}
          sharedDataTitle={alertProps.title}
          sharedDataDescription={alertProps.description}
        />
      )}
      {renderBody()}
    </div>
  );
}

/**
 * Compound component for linked resources views.
 *
 * @example
 * ```tsx
 * // With data - component handles grid layout
 * <ContentLayout.Root>
 *   <ContentLayout.Content data={documents} isLoading={isLoading} actions={<Button>Add</Button>}>
 *     {(doc) => <DocCard key={doc.id} doc={doc} />}
 *   </ContentLayout.Content>
 * </ContentLayout.Root>
 *
 * // Without data - user handles layout (grid, table, whatever)
 * <ContentLayout.Root>
 *   <ContentLayout.Content>
 *     <table>
 *       <thead>...</thead>
 *       <tbody>
 *         {notes.map(note => <tr>...</tr>)}
 *       </tbody>
 *     </table>
 *   </ContentLayout.Content>
 * </ContentLayout.Root>
 * ```
 */
export const ContentLayout = {
  Root,
  SharedAlert,
  Empty,
  Content,
};
