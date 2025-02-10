import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { useIndicateurDefinition } from '../Indicateur/useIndicateurDefinition';
import IndicateurLayout from './IndicateurLayout';

type Props = {
  dataTest?: string;
  indicateurId: number | string;
  isPerso?: boolean;
};

const IndicateurDetail = ({
  dataTest,
  indicateurId,
  isPerso = false,
}: Props) => {
  const { data: definition, isLoading } = useIndicateurDefinition(indicateurId);

  if (isLoading) return <SpinnerLoader />;
  if (!definition) return null;

  return <IndicateurLayout {...{ dataTest, definition, isPerso }} />;
};

export default IndicateurDetail;
