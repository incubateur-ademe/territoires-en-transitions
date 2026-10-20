import type { JSX } from 'react';

const CoverBanner = (): JSX.Element => (
  <div className="rounded-b-none rounded-t-lg top-[-100px] h-[69px] w-full bg-primary-9 bg-[url('/fiche-action-header-bg.jpg')] bg-cover bg-center opacity-60" />
);

export { CoverBanner };
