import { Badge, BadgeProps } from '@/ui';

type Props = Pick<BadgeProps, 'size'>;

const BadgeIndicateurCompose = ({ size }: Props) => {
  return (
    <Badge
      title="Indicateur composé"
      state="info"
      size={size}
      light
      iconPosition="left"
      icon="line-chart-line"
    />
  );
};

export default BadgeIndicateurCompose;
