'use client';

import {
  makeCollectiviteDemarchePcaetDetailUrl,
  makeCollectiviteDemarchePcaetUrl,
} from '@/app/app/paths';
import { DemarchePcaetPilotesField } from '@/app/demarches/pcaet/components/demarche-pcaet-pilotes-field';
import { createDemarchePcaet } from '@/app/demarches/pcaet/demarche-pcaet.storage';
import type { DemarchePcaetObligation } from '@/app/demarches/pcaet/demarche-pcaet.types';
import { appLabels } from '@/app/labels/catalog';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { PersonneTagOrUser } from '@tet/domain/collectivites';
import { Alert, Button, Field, Input, Select, Textarea } from '@tet/ui';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export const CreateDemarchePcaetPage = () => {
  const router = useRouter();
  const { collectiviteId } = useCurrentCollectivite();
  const [titre, setTitre] = useState('PCAET réglementaire');
  const [description, setDescription] = useState('');
  const [obligation, setObligation] =
    useState<DemarchePcaetObligation>('obligatoire');
  const [pilotes, setPilotes] = useState<PersonneTagOrUser[]>([]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const demarche = createDemarchePcaet({
      collectiviteId,
      titre,
      description,
      obligation,
      pilotes,
    });
    router.push(
      makeCollectiviteDemarchePcaetDetailUrl({
        collectiviteId,
        demarchePcaetId: demarche.id,
      })
    );
  };

  return (
    <div
      className="max-w-2xl mx-auto flex flex-col gap-6 py-4"
      data-test="CreateDemarchePcaet"
    >
      <div>
        <h1 className="text-2xl font-bold text-primary-9 mt-4">
          {appLabels.demarchePcaetCreerTitre}
        </h1>
        <p className="text-sm text-grey-7 mt-2">
          {appLabels.demarchePcaetCreerDescription}
        </p>
      </div>

      <Alert
        state="info"
        title="Première version"
        description="La démarche est créée en brouillon. Vous pourrez la publier depuis la page démarche."
      />

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <Field title="Intitulé de la démarche">
          <Input
            type="text"
            value={titre}
            onChange={(e) => setTitre(e.target.value)}
          />
        </Field>

        <Field title="Obligation">
          <Select
            options={[
              { label: 'Obligatoire', value: 'obligatoire' },
              { label: 'Volontaire', value: 'volontaire' },
            ]}
            values={obligation}
            onChange={(value) =>
              setObligation(value as DemarchePcaetObligation)
            }
          />
        </Field>

        <DemarchePcaetPilotesField
          pilotes={pilotes}
          collectiviteId={collectiviteId}
          dataTest="demarche-create-pilotes"
          onChange={setPilotes}
        />

        <Field title="Description (optionnel)">
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
          />
        </Field>

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="grey"
            href={makeCollectiviteDemarchePcaetUrl({ collectiviteId })}
          >
            Annuler
          </Button>
          <Button type="submit" variant="primary">
            Créer la démarche
          </Button>
        </div>
      </form>
    </div>
  );
};
