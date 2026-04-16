'use client';

import { CodeCommuneField } from '@/app/app/pages/Support/AjouterCollectivite/code-commune.field';
import { CodeDepartementField } from '@/app/app/pages/Support/AjouterCollectivite/code-departement.field';
import { CodeRegionField } from '@/app/app/pages/Support/AjouterCollectivite/code-region.field';
import {
  collectiviteType,
  CollectiviteTypeField,
} from '@/app/app/pages/Support/AjouterCollectivite/collectivite-type.field';
import { SirenField } from '@/app/app/pages/Support/AjouterCollectivite/siren.field';
import { useSaveCollectivite } from '@/app/app/pages/Support/AjouterCollectivite/use-save-collectivite';
import {
  CollectiviteOutput,
  useSelectCollectivite,
} from '@/app/app/pages/Support/AjouterCollectivite/use-select-collectivite';
import { appLabels } from '@/app/labels/catalog';
import { useCollectiviteId } from '@tet/api/collectivites';
import { Button, Divider, Field, Input, InputNumber } from '@tet/ui';
import { useEffect, useState } from 'react';

export const ModifierCollectivitePage = () => {
  const collectiviteId = useCollectiviteId();

  const { mutate: saveCollectivite } = useSaveCollectivite();
  const { data } = useSelectCollectivite(collectiviteId);

  const [collectivite, setCollectivite] = useState<CollectiviteOutput>(null);

  const [message, setMessage] = useState<
    { message: string; ok: boolean } | undefined
  >();

  useEffect(() => {
    if (data) {
      setCollectivite(data);
    }
  }, [data]);

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
          message: appLabels.formErreurModification({ error: error.message }),
          ok: false,
        });
      },
    });
  };

  if (!collectivite) {
    return <div>{appLabels.formChargement}</div>;
  }

  return (
    <>
      <h2 className="mb-6">{appLabels.modifierCollectivite}</h2>
      <Divider color="primary" className="mb-6" />
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
        {collectivite.type != collectiviteType.Test && (
          <div className="flex items-start gap-4">
            {collectivite.type == collectiviteType.Commune ? (
              <CodeCommuneField
                value={collectivite.communeCode ?? ''}
                onChange={(value) => updateCollectivite('communeCode', value)}
              />
            ) : (
              <SirenField
                value={collectivite.siren ?? ''}
                onChange={(value) => updateCollectivite('siren', value)}
              />
            )}
            {collectivite.type != collectiviteType.Region && (
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

        <Field title={appLabels.population}>
          <InputNumber
            value={collectivite.population?.toString() ?? ''}
            onValueChange={(e) =>
              updateCollectivite('population', e.floatValue)
            }
          />
        </Field>
        <div className="flex items-start gap-4">
          <Button
            className="self-end"
            disabled={
              !collectivite.nom ||
              (collectivite.type === collectiviteType.Commune &&
                !collectivite.communeCode) ||
              (collectivite.type === collectiviteType.EPCI &&
                !collectivite.siren) ||
              (collectivite.type !== collectiviteType.Region &&
                collectivite.type !== collectiviteType.Test &&
                !collectivite.departementCode) ||
              (collectivite.type !== collectiviteType.Test &&
                !collectivite.regionCode)
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
    </>
  );
};
