import { TDBViewParam } from '@/app/app/paths';
import { useCurrentCollectivite } from '@/app/core-logic/hooks/useCurrentCollectivite';
import { Button, ButtonProps, TrackPageView } from '@/ui';
import { pick } from 'es-toolkit';

type Props = {
  view: TDBViewParam;
  title: string;
  description: string;
  btnProps?: ButtonProps;
  children: React.ReactNode;
};

/** Vue générique parent pour les pages tableau de bord de la collectivité et personnel */
const View = ({ view, title, description, children, btnProps }: Props) => {
  const collectivite = useCurrentCollectivite()!;
  const { children: btnContent, ...btnRemainingProps } = btnProps || {};

  return (
    <div data-test={`tdb-${view}`}>
      <TrackPageView
        pageName={`app/tdb/${view}`}
        properties={pick(collectivite, [
          'collectiviteId',
          'niveauAcces',
          'role',
        ])}
      />
      {/** Header */}
      <div className="flex justify-between items-start max-sm:flex-col gap-y-4">
        <h2 className="mb-4">{title}</h2>
        {btnProps && (
          <Button {...btnRemainingProps}>{btnContent || 'Nouveau'}</Button>
        )}
      </div>
      <p className="mb-12 text-lg text-grey-8">{description}</p>
      {/** Contenu principal */}
      <div className="grid grid-cols-12 gap-10">{children}</div>
    </div>
  );
};

export default View;
