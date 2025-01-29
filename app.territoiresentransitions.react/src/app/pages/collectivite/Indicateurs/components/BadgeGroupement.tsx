import { Badge, BadgeProps } from '@/ui';

type Props = Pick<BadgeProps, 'size'>;

const BadgeGroupement = ({ size }: Props) => {
  return (
    <Badge
      title="Groupement d'indicateurs"
      state="standard"
      size={size}
      light
      iconPosition="left"
      icon="folder-2-line"
    />
  );
};

export default BadgeGroupement;
