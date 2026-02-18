import { Badge, BadgeProps } from '@tet/ui';

type Props = Pick<BadgeProps, 'size'>;

const BadgeIndicateurPerso = ({ size }: Props) => {
  return (
    <Badge
      title="Indicateur personnalisé"
      variant="success"
      type="outlined"
      size={size}
      iconPosition="left"
      icon="user-line"
    />
  );
};

export default BadgeIndicateurPerso;
