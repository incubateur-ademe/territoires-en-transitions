import { Badge, BadgeProps } from '@tet/ui';

type Props = Pick<BadgeProps, 'size'>;

const BadgeIndicateurPerso = ({ size }: Props) => {
  return (
    <Badge
      title="Indicateur personnalisé"
      state="success"
      size={size}
      light
      iconPosition="left"
      icon="user-line"
    />
  );
};

export default BadgeIndicateurPerso;
