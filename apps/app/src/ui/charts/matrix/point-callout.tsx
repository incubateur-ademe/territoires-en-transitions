import { Icon } from '@tet/ui';
import { JSX } from 'react';

type PointCalloutProps = {
  label: string;
  onClick: () => void;
};

const PointCallout = ({ label, onClick }: PointCalloutProps): JSX.Element => (
  <>
    <span
      aria-hidden
      className="absolute inset-0 animate-ping rounded-full ring-8 ring-primary-4/60"
    />
    <span
      aria-hidden
      className="absolute inset-0 rounded-full ring-8 ring-primary-4/60"
    />
    <button
      type="button"
      tabIndex={-1}
      onClick={onClick}
      className="pointer-events-auto absolute -left-3 top-full mt-4 flex w-max items-center gap-2 rounded-lg bg-primary-9 px-3 py-2 text-xs font-medium text-white shadow-card"
    >
      <Icon icon="arrow-up-line" size="2xs" aria-hidden />
      {label}
    </button>
  </>
);

export { PointCallout };
