'use client';

import { CodeCommuneField } from '@/app/app/pages/Support/AjouterCollectivite/code-commune.field';
import { CodeDepartementField } from '@/app/app/pages/Support/AjouterCollectivite/code-departement.field';
import { CodeRegionField } from '@/app/app/pages/Support/AjouterCollectivite/code-region.field';
import {
  collectiviteType,
  CollectiviteTypeField,
} from '@/app/app/pages/Support/AjouterCollectivite/collectivite-type.field';
import { SirenField } from '@/app/app/pages/Support/AjouterCollectivite/siren.field';
import { useFindCollectivite } from '@/app/app/pages/Support/AjouterCollectivite/use-find-collectivite';
import {
  CollectiviteInput,
  useGetAdditionalInformationCollectivite,
} from '@/app/app/pages/Support/AjouterCollectivite/use-get-additional-information-collectivite';
import { useSaveCollectivite } from '@/app/app/pages/Support/AjouterCollectivite/use-save-collectivite';
import { Button, Field, Input } from '@/ui';
import { InputNumber } from '@/ui/design-system/Input/InputNumber';
import { useState } from 'react';

const statusSearch = {
  none: 'none',
  DBFound: 'DBFound',
  inseeFound: 'inseeFound',
  inseeNotFound: 'inseeNotFound',
} as const;

type StatusSearch = keyof typeof statusSearch;

export const AjouterCollectivitePage = () => {
  const [collectivite, setCollectivite] = useState<CollectiviteInput>({
    type: collectiviteType.Commune,
    communeCode: undefined,
    siren: undefined,
    departementCode: undefined,
    regionCode: undefined,
    nom: undefined,
    population: undefined,
  });

  const { data: dataDB, refetch: searchDB } = useFindCollectivite(collectivite);
  const { refetch: searchInsee } =
    useGetAdditionalInformationCollectivite(collectivite);
  const { mutate: createCollectivite } = useSaveCollectivite();

  const [status, setStatus] = useState<StatusSearch>(statusSearch.none);
  const [message, setMessage] = useState<
    { message: string; ok: boolean } | undefined
  >();

  const updateCollectivite = (key: string, value: any, reset?: boolean) => {
    setCollectivite((prev) => {
      setMessage(undefined);
      if (key === 'type') {
        setStatus(statusSearch.none);
        return { type: value ?? collectiviteType.Commune };
      }
      if (reset) {
        setStatus(statusSearch.none);
        return { type: collectivite.type, [key]: value };
      }
      return {
        ...prev,
        [key]: value == '' ? undefined : value,
      };
    });
  };

  const handleSearch = async () => {
    const colDB = await searchDB();
    if (colDB?.data?.nom) {
      setStatus(statusSearch.DBFound);
    } else {
      const colInsee = await searchInsee();
      if (colInsee?.data?.nom) {
        setCollectivite((prev) => ({
          ...prev,
          ...colInsee.data,
        }));
        setStatus(statusSearch.inseeFound);
      } else {
        setStatus(statusSearch.inseeNotFound);
      }
    }
  };

  const handleSave = () => {
    if (collectivite.nom) {
      createCollectivite(collectivite, {
        onSuccess: (data) => {
          setMessage({
            message: `Création réussie. Identifiant de la collectivité créée : ${data.id}`,
            ok: true,
          });
        },
        onError: (error) => {
          setMessage({
            message: `Erreur lors de la création : ${error}`,
            ok: false,
          });
        },
      });
    }
  };

  return (
    <>
      <h2>Ajouter une collectivité</h2>
      <hr />
      <div className="flex items-start gap-4">
        <CollectiviteTypeField
          type={collectivite.type ?? collectiviteType.Commune}
          onSelect={(type) => updateCollectivite('type', type?.value as string)}
        />
        {collectivite.type == collectiviteType.Commune && (
          <CodeCommuneField
            value={collectivite.communeCode ?? ''}
            onChange={(value) => updateCollectivite('communeCode', value, true)}
          />
        )}
        {collectivite.type == collectiviteType.EPCI && (
          <SirenField
            value={collectivite.siren ?? ''}
            onChange={(value) => updateCollectivite('siren', value, true)}
          />
        )}
        {collectivite.type == collectiviteType.Departement && (
          <CodeDepartementField
            value={collectivite.departementCode ?? ''}
            onChange={(value) =>
              updateCollectivite('departementCode', value, true)
            }
          />
        )}
        {collectivite.type == collectiviteType.Region && (
          <CodeRegionField
            value={collectivite.regionCode ?? ''}
            onChange={(value) => updateCollectivite('regionCode', value, true)}
          />
        )}
        {collectivite.type && collectivite.type != collectiviteType.Test && (
          <Button
            className="self-end"
            disabled={
              (collectivite.type == collectiviteType.Commune &&
                collectivite.communeCode?.length != 5) ||
              (collectivite.type == collectiviteType.EPCI &&
                collectivite.siren?.length != 9) ||
              (collectivite.type == collectiviteType.Departement &&
                !collectivite.departementCode) ||
              (collectivite.type == collectiviteType.Region &&
                !collectivite.regionCode)
            }
            onClick={handleSearch}
          >
            Chercher la collectivité
          </Button>
        )}
      </div>
      {collectivite.type && collectivite.type !== collectiviteType.Test && (
        <p className="text-sm italic text-gray-400 text-right">
          {"Cherche la collectivité dans les données de l'INSEE 2020"}
        </p>
      )}
      <hr />
      <div className="space-y-6">
        {status === statusSearch.none &&
          collectivite.type !== collectiviteType.Test && (
            <p className="text-blue-500">
              {`Lancez la recherche ci-dessus pour pré-remplir les champs suivants`}
            </p>
          )}
        {status === statusSearch.DBFound && (
          <p className="text-red-500">
            {`La collectivité cherchée existe déjà avec l'identifiant ${dataDB?.id}`}
          </p>
        )}
        {status === statusSearch.inseeFound && (
          <p className="text-green-500">
            {`Collectivité trouvée dans les données de l'INSEE. Veuillez compléter ou corriger les champs
            suivants si besoin avant de valider.`}
          </p>
        )}
        {status === statusSearch.inseeNotFound && (
          <p className="text-orange-500">{`Collectivité non trouvée dans les données de l'INSEE. Vous pouvez quand même saisir les données manuellement dans les champs suivants avant de valider.`}</p>
        )}
        <Field title="Nom de la collectivité">
          <Input
            type="text"
            value={collectivite.nom ?? ''}
            onChange={(e) => updateCollectivite('nom', e.target.value)}
          />
        </Field>
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

        <Field title="Population">
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
            Créer la collectivité
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
