import { useIndicateurDefinition } from '../Indicateur/useIndicateurDefinition';
import IndicateurLayout from './IndicateurLayout';

type Props = {
  indicateurId: number | string;
  isPerso?: boolean;
};

const IndicateurDetail = ({ indicateurId, isPerso = false }: Props) => {
  const definition = useIndicateurDefinition(indicateurId);

  if (!definition) return null;

  return <IndicateurLayout definition={definition} isPerso={isPerso} />;
};

export default IndicateurDetail;
