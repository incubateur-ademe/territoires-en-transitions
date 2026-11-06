import { ReactNode } from 'react';

/**
 * Section du panneau, sans carte pour garder toute la largeur : titre en
 * capitales et filet de séparation, comme le panneau des documents.
 */
export const DossierSection = ({
  title,
  badge,
  dataTest,
  children,
}: {
  title: string;
  badge?: ReactNode;
  dataTest?: string;
  children: ReactNode;
}) => (
  <section
    className="flex flex-col gap-4 border-t border-grey-3 pt-6"
    data-test={dataTest}
  >
    <div className="flex items-center gap-2">
      <h3 className="m-0 text-sm text-primary-9 font-bold uppercase">
        {title}
      </h3>
      {badge}
    </div>
    {children}
  </section>
);
