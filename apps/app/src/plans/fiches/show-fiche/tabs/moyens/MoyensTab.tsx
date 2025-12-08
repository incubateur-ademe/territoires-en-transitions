import { ComponentProps } from 'react';

import { MoyensView } from '@/app/plans/fiches/update-fiche/moyens/moyens.view';

type MoyensTabProps = ComponentProps<typeof MoyensView>;

export const MoyensTab = (props: MoyensTabProps) => {
  return <MoyensView {...props} />;
};

