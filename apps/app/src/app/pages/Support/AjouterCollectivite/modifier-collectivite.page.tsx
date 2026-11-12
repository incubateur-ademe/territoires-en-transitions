'use client';

import { CodeCommuneField } from '@/app/app/pages/Support/AjouterCollectivite/code-commune.field';
import { CodeDepartementField } from '@/app/app/pages/Support/AjouterCollectivite/code-departement.field';
import { CodeRegionField } from '@/app/app/pages/Support/AjouterCollectivite/code-region.field';
import {
  collectiviteType,
  CollectiviteTypeField,
} from '@/app/app/pages/Support/AjouterCollectivite/collectivite-type.field';
import { isIncomplete } from '@/app/app/pages/Support/AjouterCollectivite/collectivite-form.utils';
import { getCollectiviteErrorMessage } from '@/app/app/pages/Support/AjouterCollectivite/get-collectivite-error-message';
import { SirenField } from '@/app/app/pages/Support/AjouterCollectivite/siren.field';
import { useSaveCollectivite } from '@/app/app/pages/Support/AjouterCollectivite/use-save-collectivite';
import {
  CollectiviteOutput,
  useSelectCollectivite,
} from '@/app/app/pages/Support/AjouterCollectivite/use-select-collectivite';
import { appLabels } from '@/app/labels/catalog';
import { useCollectiviteId } from '@tet/api/collectivites';
import { Button, Divider, Field, Input, InputNumber } from '@tet/ui';
import { useState } from 'react';

export const ModifierCollectivitePage = () => {
  const collectiviteId = useCollectiviteId();

  const { mutate: saveCollectivite } = useSaveCollectivite();
  const { data } = useSelectCollectivite(collectiviteId);

  const [collectivite, setCollectivite] = useState<CollectiviteOutput>(null);

  const [message, setMessage] = useState<
    { message: string; ok: boolean } | undefined
  >();

  // Recharge le formulaire quand la collectivité arrive (ou change). L'ajuster
  // pendant le rendu, plutôt que dans un effet, évite d'afficher un instant le
  // formulaire de la collectivité précédente.
  const [previousData, setPreviousData] = useState(data);
  if (previousData !== data) {
    setPreviousData(data);
    if (data) {
      setCollectivite(data);
    }
  }

  const updateCollectivite = (key: string, value: any) => {
    if (!collectivite) return;
    setCollectivite({
      ...collectivite,
      [key]: value === '' ? undefined : value,
    });
    setMessage(undefined);
  };

  const handleSave = () => {
    if (!collectivite) return;

    saveCollectivite(collectivite, {
      onSuccess: () => {
        setMessage({
          message: appLabels.formModificationReussie,
          ok: true,
        });
      },
      onError: (error) => {
        setMessage({
          message: appLabels.formErreurModification({
            error: getCollectiviteErrorMessage(error),
          }),
          ok: false,
        });
      },
    });
  };

  if (!collectivite) {
    return <div>{appLabels.formChargement}</div>;
  }

  const isCollectiviteSansIdentifiant =
    collectivite.type === collectiviteType.Test ||
    collectivite.type === collectiviteType.StructureSansStatutJuridique;

  // Seul l'identifiant affiché pour ce type bloque l'enregistrement : un champ
  // masqué en erreur désactiverait le bouton sans explication.
  const hasCodeCommune = collectivite.type === collectiviteType.Commune;
  const hasSiren =
    !isCollectiviteSansIdentifiant &&
    !hasCodeCommune &&
    collectivite.type !== collectiviteType.Dreal;
  const isSirenIncomplete = hasSiren && isIncomplete(collectivite.siren, 9);
  const isCodeCommuneIncomplete =
    hasCodeCommune && isIncomplete(collectivite.communeCode, 5);

  return (
    <div className="space-y-6">
      <h2>{appLabels.modifierCollectivite}</h2>
      <Divider color="primary" />
      <div className="space-y-6">
        <div className="grid grid-cols-[auto_1fr] items-start gap-4">
          <CollectiviteTypeField
            type={collectivite.type ?? collectiviteType.Commune}
            onSelect={(type) =>
              updateCollectivite('type', type?.value as string)
            }
          />
          <Field title={appLabels.formNomCollectivite} className="self-end">
            <Input
              type="text"
              value={collectivite.nom ?? ''}
              onChange={(e) => updateCollectivite('nom', e.target.value)}
            />
          </Field>
        </div>
        {!isCollectiviteSansIdentifiant && (
          <div className="flex items-start gap-4">
            {collectivite.type == collectiviteType.Commune ? (
              <CodeCommuneField
                value={collectivite.communeCode ?? ''}
                onChange={(value) => updateCollectivite('communeCode', value)}
                error={
                  isCodeCommuneIncomplete
                    ? appLabels.formCinqChiffresAttendus
                    : undefined
                }
              />
            ) : (
              collectivite.type !== collectiviteType.Dreal && (
                <SirenField
                  value={collectivite.siren ?? ''}
                  onChange={(value) => updateCollectivite('siren', value)}
                  error={
                    isSirenIncomplete
                      ? appLabels.formNeufChiffresAttendus
                      : undefined
                  }
                />
              )
            )}
            {collectivite.type != collectiviteType.Region &&
              collectivite.type !== collectiviteType.Dreal && (
                <CodeDepartementField
                  value={collectivite.departementCode ?? ''}
                  onChange={(value) =>
                    updateCollectivite('departementCode', value)
                  }
                />
              )}
            <CodeRegionField
              value={collectivite.regionCode ?? ''}
              onChange={(value) => updateCollectivite('regionCode', value)}
            />
          </div>
        )}

        {collectivite.type !== collectiviteType.Dreal && (
          <Field title={appLabels.population}>
            <InputNumber
              value={collectivite.population?.toString() ?? ''}
              onValueChange={(e) =>
                updateCollectivite('population', e.floatValue)
              }
            />
          </Field>
        )}
        <div className="flex items-start gap-4">
          <Button
            className="self-end"
            disabled={
              !collectivite.nom ||
              isSirenIncomplete ||
              isCodeCommuneIncomplete ||
              (collectivite.type === collectiviteType.Commune &&
                !collectivite.communeCode) ||
              (collectivite.type === collectiviteType.EPCI &&
                !collectivite.siren) ||
              (collectivite.type !== collectiviteType.Region &&
                collectivite.type !== collectiviteType.Dreal &&
                !isCollectiviteSansIdentifiant &&
                !collectivite.departementCode) ||
              (!isCollectiviteSansIdentifiant && !collectivite.regionCode)
            }
            onClick={handleSave}
          >
            {appLabels.modifierCollectivite}
          </Button>
          {message && (
            <p className={message.ok ? 'text-green-500' : 'text-red-500'}>
              {message.message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
