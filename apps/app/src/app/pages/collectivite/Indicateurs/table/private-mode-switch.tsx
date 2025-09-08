import { useCurrentCollectivite } from '@/api/collectivites';
import { IndicateurDefinition } from '@/app/indicateurs/definitions/use-get-indicateur-definition';
import { useUpdateIndicateurDefinition } from '@/app/indicateurs/definitions/use-update-indicateur-definition';
import { Checkbox, Tooltip } from '@/ui';

/** Affiche le bouton "Résultat récent en mode privé" */
export const PrivateModeSwitch = ({
  definition,
}: {
  definition: Pick<IndicateurDefinition, 'id' | 'estConfidentiel'>;
}) => {
  const { isReadOnly } = useCurrentCollectivite();
  const { mutate: updateIndicateur } = useUpdateIndicateurDefinition(
    definition.id
  );

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
