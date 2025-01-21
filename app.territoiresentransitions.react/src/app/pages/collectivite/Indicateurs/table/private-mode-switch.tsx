import { useCurrentCollectivite } from '@/app/core-logic/hooks/useCurrentCollectivite';
import { Checkbox, Tooltip } from '@/ui';
import { useToggleIndicateurConfidentiel } from '../Indicateur/detail/useToggleIndicateurConfidentiel';
import { TIndicateurDefinition } from '../types';

/** Affiche le bouton "Résultat récent en mode privé" */
export const PrivateModeSwitch = ({
  definition,
}: {
  definition: TIndicateurDefinition;
}) => {
  const collectivite = useCurrentCollectivite();
  const isReadonly = !collectivite || collectivite.isReadOnly;
  const { mutate: toggleIndicateurConfidentiel } =
    useToggleIndicateurConfidentiel(definition);
  const { confidentiel } = definition;

  return (
    !isReadonly && (
      <div className="flex my-4">
        <Tooltip
          label="Si le mode privé est activé, le résultat le plus récent n'est plus
              consultable par les personnes n’étant pas membres de votre
              collectivité. Seuls les autres résultats restent accessibles pour
              tous les utilisateurs et la valeur privée reste consultable par
              l’ADEME et le service support de la plateforme."
        >
          {/** Permet de prendre en compte la checkbox + le label (autrement uniquement la checkbox trigger le tooltip) */}
          <div>
            <Checkbox
              variant="switch"
              label="Résultat récent en mode privé"
              checked={confidentiel}
              onChange={() =>
                toggleIndicateurConfidentiel(confidentiel || false)
              }
            />
          </div>
        </Tooltip>
      </div>
    )
  );
};
