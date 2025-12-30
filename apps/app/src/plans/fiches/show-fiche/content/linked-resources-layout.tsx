import { SharedFicheLinkedResourcesAlert } from '@/app/plans/fiches/share-fiche/shared-fiche-linked-resources.alert';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { EmptyCard } from '@tet/ui';
import { Children, ComponentProps, isValidElement, ReactNode } from 'react';
import { useFicheContext } from '../context/fiche-context';

type AlertProps = {
  title: string;
  description: string;
};

type EmptyProps = Omit<
  ComponentProps<typeof EmptyCard>,
  'size' | 'variant' | 'isReadonly'
>;

type ContentProps<T> = {
  data: T[] | undefined;
  isLoading: boolean;
  actions?: ReactNode;
  children: (item: T) => ReactNode;
};

const SharedAlert = (_props: AlertProps) => null;
const Empty = (_props: EmptyProps) => null;
const Content = <T,>(_props: ContentProps<T>) => null;

SharedAlert.displayName = 'LinkedResources.SharedAlert';
Empty.displayName = 'LinkedResources.Empty';
Content.displayName = 'LinkedResources.Content';

function Root({ children }: { children: ReactNode }) {
  const { fiche, isReadonly } = useFicheContext();

  // Extract props from slot children
  let alertProps: AlertProps | undefined;
  let emptyProps: EmptyProps | undefined;
  let contentProps: ContentProps<unknown> | undefined;

  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;

    const displayName = (child.type as { displayName?: string }).displayName;

    if (displayName === SharedAlert.displayName) {
      alertProps = child.props as AlertProps;
    } else if (displayName === Empty.displayName) {
      emptyProps = child.props as EmptyProps;
    } else if (displayName === Content.displayName) {
      contentProps = child.props as ContentProps<unknown>;
    }
  });

  const data = contentProps?.data;
  const isEmpty = !data || data.length === 0;
  const isLoading = contentProps?.isLoading || false;
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
          isReadonly={isReadonly}
        />
      );
    }

    if (data && contentProps) {
      return (
        <>
          {contentProps.actions && (
            <div className="flex justify-end gap-2 mb-4">
              {contentProps.actions}
            </div>
          )}
          <div className="grid sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-6">
            {data.map(contentProps.children)}
          </div>
        </>
      );
    }

    return null;
  };

  return (
    <>
      {alertProps && (
        <SharedFicheLinkedResourcesAlert
          fiche={fiche}
          currentCollectiviteId={fiche.collectiviteId}
          sharedDataTitle={alertProps.title}
          sharedDataDescription={alertProps.description}
        />
      )}
      {renderBody()}
    </>
  );
}

/**
 * Compound component for linked resources views.
 *
 * @example
 * ```tsx
 * <LinkedResources.Root>
 *   <LinkedResources.SharedAlert title="..." description="..." />
 *   <LinkedResources.Empty picto={...} title="..." actions={[...]} />
 *   <LinkedResources.Content data={documents} isLoading={isLoading} actions={<Button>Add</Button>}>
 *     {(doc) => <DocCard key={doc.id} doc={doc} />}
 *   </LinkedResources.Content>
 * </LinkedResources.Root>
 * ```
 */
export const LinkedResources = {
  Root,
  SharedAlert,
  Empty,
  Content,
};
