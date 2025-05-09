import { Badge } from '@/app/ui/export-pdf/components';
import { getFormattedFloat } from '@/app/utils/formatUtils';
import { Text } from '@react-pdf/renderer';
import classNames from 'classnames';
import { tw } from '../../utils';

type BadgeBudgetProps = {
  montant: number | undefined | null;
  unite?: 'HT' | 'ETP';
  size?: 'sm' | 'md';
  className?: string;
};

export const BadgeBudget = ({
  montant,
  unite = 'HT',
  className,
  ...props
}: BadgeBudgetProps) => {
  return (
    <Badge
      title={
        !montant && montant !== 0 ? (
          'Non renseigné'
        ) : (
          <Text>
            {getFormattedFloat(montant)}{' '}
            {unite === 'HT' ? (
              <>
                € <Text style={tw('text-[0.5rem] leading-[0.6rem]')}>HT</Text>
              </>
            ) : (
              <>ETP</>
            )}
          </Text>
        )
      }
      state="standard"
      className={classNames('bg-white', className)}
      {...props}
    />
  );
};
