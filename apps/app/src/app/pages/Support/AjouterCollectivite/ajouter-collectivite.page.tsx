'use client';

import { CodeCommuneField } from '@/app/app/pages/Support/AjouterCollectivite/code-commune.field';
import { CodeDepartementField } from '@/app/app/pages/Support/AjouterCollectivite/code-departement.field';
import { CodeRegionField } from '@/app/app/pages/Support/AjouterCollectivite/code-region.field';
import {
  collectiviteType,
  CollectiviteTypeField,
} from '@/app/app/pages/Support/AjouterCollectivite/collectivite-type.field';
import { NicField } from '@/app/app/pages/Support/AjouterCollectivite/nic.field';
import { SirenField } from '@/app/app/pages/Support/AjouterCollectivite/siren.field';
import { useFindCollectivite } from '@/app/app/pages/Support/AjouterCollectivite/use-find-collectivite';
import {
  CollectiviteInput,
  useGetAdditionalInformationCollectivite,
} from '@/app/app/pages/Support/AjouterCollectivite/use-get-additional-information-collectivite';
import { useSaveCollectivite } from '@/app/app/pages/Support/AjouterCollectivite/use-save-collectivite';
import { appLabels } from '@/app/labels/catalog';
import { Button, Divider, Field, Input, InputNumber } from '@tet/ui';
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
    nom: '',
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
        return { type: value ?? collectiviteType.Commune, nom: '' };
      }
      if (reset) {
        setStatus(statusSearch.none);
        return { type: collectivite.type, [key]: value, nom: '' };
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
            message: appLabels.formCreationReussie({ id: data.id }),
            ok: true,
          });
        },
        onError: (error) => {
          setMessage({
            message: appLabels.formErreurCreation({ error: String(error) }),
            ok: false,
          });
        },
      });
    }
  };

  const selectedType = collectivite.type as string | undefined;
  const isCollectiviteSansRecherche =
    selectedType === collectiviteType.Test ||
    selectedType === collectiviteType.StructureSansStatutJuridique;

  return (
    <>
      <h2 className="mb-6">{appLabels.ajouterCollectivite}</h2>
      <Divider color="primary" className="mb-6" />
      <div className="flex items-start gap-4">
        <CollectiviteTypeField
          type={selectedType ?? collectiviteType.Commune}
          onSelect={(type) => updateCollectivite('type', type?.value)}
        />
        {selectedType == collectiviteType.Commune && (
          <CodeCommuneField
            value={collectivite.communeCode ?? ''}
            onChange={(value) => updateCollectivite('communeCode', value, true)}
          />
        )}
        {selectedType == collectiviteType.EPCI && (
          <SirenField
            value={collectivite.siren ?? ''}
            onChange={(value) => updateCollectivite('siren', value, true)}
          />
        )}
        {(selectedType === collectiviteType.Departement ||
          selectedType === collectiviteType.PrefectureDepartement) && (
          <CodeDepartementField
            value={collectivite.departementCode ?? ''}
            onChange={(value) =>
              updateCollectivite('departementCode', value, true)
            }
          />
        )}
        {(selectedType === collectiviteType.Region ||
          selectedType === collectiviteType.PrefectureRegion) && (
          <CodeRegionField
            value={collectivite.regionCode ?? ''}
            onChange={(value) => updateCollectivite('regionCode', value, true)}
          />
        )}
        {selectedType === collectiviteType.ServicePublic && (
          <>
            <SirenField
              value={collectivite.siren ?? ''}
              onChange={(value) => updateCollectivite('siren', value, true)}
            />
            <NicField
              value={collectivite.nic ?? ''}
              onChange={(value) => updateCollectivite('nic', value, true)}
            />
          </>
        )}
        {selectedType && !isCollectiviteSansRecherche && (
          <Button
            className="self-end"
            disabled={
              (selectedType == collectiviteType.Commune &&
                collectivite.communeCode?.length != 5) ||
              (selectedType == collectiviteType.EPCI &&
                collectivite.siren?.length != 9) ||
              ((selectedType == collectiviteType.Departement ||
                selectedType == collectiviteType.PrefectureDepartement) &&
                !collectivite.departementCode) ||
              ((selectedType == collectiviteType.Region ||
                selectedType == collectiviteType.PrefectureRegion) &&
                !collectivite.regionCode) ||
              (selectedType == collectiviteType.ServicePublic &&
                (collectivite.siren?.length != 9 ||
                  collectivite.nic?.length != 5))
            }
            onClick={handleSearch}
          >
            {appLabels.formChercherCollectivite}
          </Button>
        )}
      </div>
      {selectedType && !isCollectiviteSansRecherche && (
        <p className="text-sm italic text-gray-400 text-right">
          {appLabels.formChercherInsee}
        </p>
      )}
      <Divider color="primary" className="mb-6" />
      <div className="space-y-6">
        {status === statusSearch.none && !isCollectiviteSansRecherche && (
          <p className="text-blue-500">{appLabels.formLancezRecherche}</p>
        )}
        {status === statusSearch.DBFound && (
          <p className="text-red-500">
            {appLabels.collectiviteExisteDeja({ id: Number(dataDB?.id) })}
          </p>
        )}
        {status === statusSearch.inseeFound && (
          <p className="text-green-500">
            {appLabels.formCollectiviteTrouveeInsee}
          </p>
        )}
        {status === statusSearch.inseeNotFound && (
          <p className="text-orange-500">
            {appLabels.formCollectiviteNonTrouveeInsee}
          </p>
        )}
        <Field title={appLabels.formNomCollectivite}>
          <Input
            type="text"
            value={collectivite.nom ?? ''}
            onChange={(e) => updateCollectivite('nom', e.target.value)}
          />
        </Field>
        {!isCollectiviteSansRecherche && (
          <div className="flex items-start gap-4">
            {selectedType == collectiviteType.Commune ? (
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
            {selectedType === collectiviteType.ServicePublic && (
              <NicField
                value={collectivite.nic ?? ''}
                onChange={(value) => updateCollectivite('nic', value)}
              />
            )}
            {selectedType !== collectiviteType.Region &&
              selectedType !== collectiviteType.PrefectureRegion &&
              selectedType !== collectiviteType.ServicePublic && (
                <CodeDepartementField
                  value={collectivite.departementCode ?? ''}
                  onChange={(value) =>
                    updateCollectivite('departementCode', value)
                  }
                />
              )}
            {selectedType !== collectiviteType.ServicePublic && (
              <CodeRegionField
                value={collectivite.regionCode ?? ''}
                onChange={(value) => updateCollectivite('regionCode', value)}
              />
            )}
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
              (selectedType === collectiviteType.Commune &&
                !collectivite.communeCode) ||
              (selectedType === collectiviteType.EPCI && !collectivite.siren) ||
              (selectedType === collectiviteType.ServicePublic &&
                (!collectivite.siren || !collectivite.nic)) ||
              (selectedType !== collectiviteType.Region &&
                selectedType !== collectiviteType.PrefectureRegion &&
                !isCollectiviteSansRecherche &&
                selectedType !== collectiviteType.ServicePublic &&
                !collectivite.departementCode) ||
              (!isCollectiviteSansRecherche &&
                selectedType !== collectiviteType.ServicePublic &&
                !collectivite.regionCode)
            }
            onClick={handleSave}
          >
            {appLabels.formCreerCollectivite}
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
