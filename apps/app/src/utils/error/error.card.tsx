import { appLabels } from '@/app/labels/catalog';
import { EmptyCard, PictoWarning } from '@tet/ui';
import { TRPCClientErrorLike } from '@trpc/client';

type Props = {
  error?: Error | TRPCClientErrorLike<any>;
  title: string;
  subTitle?: string;
  crashId?: string;
  retry?: () => void;
  retryLabel?: string;
};

export function ErrorCard({
  error,
  title,
  subTitle,
  crashId,
  retry,
  retryLabel,
}: Props) {
  return (
    <EmptyCard
      picto={(props) => <PictoWarning {...props} />}
      title={title}
      subTitle={subTitle}
      description={
        crashId && error
          ? appLabels.erreurPartageMessageCrash({ crashId })
          : undefined
      }
      actions={
        retry
          ? [
              {
                children: retryLabel ? retryLabel : appLabels.rechargerPage,
                onClick: retry,
                variant: 'outlined',
              },
            ]
          : undefined
      }
    />
  );
}
