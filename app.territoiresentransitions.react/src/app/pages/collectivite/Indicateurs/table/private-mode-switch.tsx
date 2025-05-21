import { useCurrentCollectivite } from '@/api/collectivites';
import { Checkbox, Tooltip } from '@/ui';
import { useToggleIndicateurConfidentiel } from '../Indicateur/detail/useToggleIndicateurConfidentiel';
import { TIndicateurDefinition } from '../types';

/** Affiche le bouton "Résultat récent en mode privé" */
export const PrivateModeSwitch = ({
  definition,
}: {
  definition: TIndicateurDefinition;
}) => {
  const { isReadOnly } = useCurrentCollectivite();
  const { mutate: toggleIndicateurConfidentiel } =
    useToggleIndicateurConfidentiel(definition);
  const { confidentiel } = definition;

  return (
    !isReadOnly && (
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
              checked={confidentiel || false}
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
