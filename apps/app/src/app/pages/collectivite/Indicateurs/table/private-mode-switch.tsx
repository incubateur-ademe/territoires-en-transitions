import { IndicateurDefinition } from '@/app/indicateurs/indicateurs/use-get-indicateur';
import { useUpdateIndicateur } from '@/app/indicateurs/indicateurs/use-update-indicateur';
import { Checkbox, Tooltip } from '@tet/ui';

/** Affiche le bouton "Résultat récent en mode privé" */
export const PrivateModeSwitch = ({
  definition,
  isReadOnly,
}: {
  definition: Pick<IndicateurDefinition, 'id' | 'estConfidentiel'>;
  isReadOnly?: boolean;
}) => {
  const { mutate: updateIndicateur } = useUpdateIndicateur(definition.id);

  const { estConfidentiel } = definition;

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
              checked={estConfidentiel || false}
              onChange={() =>
                updateIndicateur({
                  estConfidentiel: !estConfidentiel,
                })
              }
            />
          </div>
        </Tooltip>
      </div>
    )
  );
};
