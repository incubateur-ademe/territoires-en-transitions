import { PropsWithChildren } from 'react';

/** Un bloc de l'écran, sous son titre : avis, pièces de l'adoption, dossier transmis. */
export const DocumentsBloc = ({
  titre,
  description,
  children,
}: PropsWithChildren<{ titre: string; description?: string }>) => (
  <section className="flex flex-col gap-3">
    <div className="flex flex-col gap-1">
      <h3 className="m-0 text-base font-bold text-primary-9">{titre}</h3>
      {description && <p className="m-0 text-sm text-grey-7">{description}</p>}
    </div>
    {children}
  </section>
);
