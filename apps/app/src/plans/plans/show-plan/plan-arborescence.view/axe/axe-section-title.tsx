import { Icon } from '@tet/ui';
import { RiFileLine, RiFileTextLine, RiLink } from '@remixicon/react';

const Sections = {
  fiches: {
    title: 'Actions',
    icon: <RiFileLine />,
  },
  description: {
    title: 'Description',
    icon: <RiFileTextLine />,
  },
  indicateurs: {
    title: 'Indicateurs liés',
    icon: <RiLink />,
  },
} as const;

type Props = {
  name: keyof typeof Sections;
};

export const AxeSectionTitle = ({ name }: Props) => {
  return (
    <p className="text-grey-8 text-sm mt-4 mb-2">
      <Icon icon={Sections[name].icon} className="mr-2" />
      {Sections[name].title}
    </p>
  );
};
