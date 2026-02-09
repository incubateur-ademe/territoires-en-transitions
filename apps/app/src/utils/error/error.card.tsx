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
          ? `Dans l'optique de pouvoir régler ce problème technique et améliorer l'expérience pour tous nos utilisateurs, nous vous invitons à nous partager le message d'erreur ainsi que l'identifiant ${crashId} via le chat en bas à droite, ou par mail à contact@territoiresentransitions.fr`
          : undefined
      }
      actions={
        retry
          ? [
              {
                children: retryLabel ? retryLabel : 'Recharger la page',
                onClick: retry,
                variant: 'outlined',
              },
            ]
          : undefined
      }
    />
  );
}
