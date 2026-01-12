import { Icon } from '@tet/ui';

const Sections = {
  fiches: {
    title: 'Actions',
    icon: 'file-line',
  },
  description: {
    title: 'Description',
    icon: 'file-text-line',
  },
  indicateurs: {
    title: 'Indicateurs liés',
    icon: 'link',
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
