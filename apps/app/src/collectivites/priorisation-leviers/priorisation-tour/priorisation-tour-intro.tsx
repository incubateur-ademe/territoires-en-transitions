import { appLabels } from '@/app/labels/catalog';
import { Alert } from '@tet/ui';
import { JSX } from 'react';

type IntroPart = {
  title: string;
  description: string;
};

type IntroPartItemProps = IntroPart & {
  position: number;
};

const INTRO_PARTS: readonly IntroPart[] = [
  {
    title: appLabels.priorisationVisiteReperageTitre,
    description: appLabels.priorisationVisiteReperageDescription,
  },
  {
    title: appLabels.priorisationVisiteExplorationTitre,
    description: appLabels.priorisationVisiteExplorationDescription,
  },
  {
    title: appLabels.priorisationVisiteSauvegardeTitre,
    description: appLabels.priorisationVisiteSauvegardeDescription,
  },
];

const IntroPartItem = ({
  position,
  title,
  description,
}: IntroPartItemProps): JSX.Element => (
  <li className="flex items-start gap-3 rounded-xl border border-grey-3 bg-grey-1 p-3">
    <span
      aria-hidden
      className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary-9 text-xs font-bold text-white"
    >
      {position}
    </span>
    <div className="flex flex-col gap-0.5">
      <h3 className="mb-0 text-sm font-bold leading-5 text-primary-9">
        {title}
      </h3>
      <p className="mb-0 text-xs text-grey-8">{description}</p>
    </div>
  </li>
);

const PriorisationTourIntro = (): JSX.Element => (
  <div className="flex flex-col gap-3">
    <ol role="list" className="m-0 flex list-none flex-col gap-2 p-0">
      {INTRO_PARTS.map((part, index) => (
        <IntroPartItem key={part.title} position={index + 1} {...part} />
      ))}
    </ol>
    <Alert
      state="info"
      description={
        <p className="mb-0 text-xs text-grey-9">
          <strong className="text-info-1">
            {appLabels.priorisationVisiteIaTitre}
          </strong>{' '}
          {appLabels.priorisationVisiteIaDescription}
        </p>
      }
    />
  </div>
);

export { PriorisationTourIntro };
