import { appLabels } from '@/app/labels/catalog';
import { ReactNode, Ref } from 'react';

export const SuiviPlanBloc = ({
  titre,
  sousTitre = appLabels.suiviPlanACeJour,
  actions,
  dataTest,
  ref,
  children,
}: {
  titre: ReactNode;
  sousTitre?: ReactNode;
  actions?: ReactNode;
  dataTest?: string;
  ref?: Ref<HTMLElement>;
  children: ReactNode;
}) => (
  <section
    ref={ref}
    className="flex flex-col gap-4 p-6 bg-white border border-grey-3 rounded-lg shadow-button"
    data-test={dataTest}
  >
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-2">
        <h2 className="mb-0 text-lg leading-6 text-primary-9">{titre}</h2>
        <span className="text-sm text-grey-8">{sousTitre}</span>
      </div>
      {actions && (
        <div className="flex items-center gap-2" data-html2canvas-ignore>
          {actions}
        </div>
      )}
    </div>
    {children}
  </section>
);
