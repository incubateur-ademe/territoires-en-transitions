import { useIndicateurActions } from '../detail/context/indicateur-actions.context';
import { useIndicateurData } from '../detail/context/indicateur-data.context';
import { PrivateModeToggle } from './private-mode-toggle';

export const PrivateModeSwitch = () => {
  const { indicateur } = useIndicateurData();
  const { updateIndicateur } = useIndicateurActions();

  return (
    <PrivateModeToggle
      isConfidentiel={indicateur.estConfidentiel || false}
      onChange={(estConfidentiel) => updateIndicateur({ estConfidentiel })}
    />
  );
};
