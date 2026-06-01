'use client';

import { makeCollectiviteDemarchePcaetDetailUrl } from '@/app/app/paths';
import PersonneTagDropdown from '@/app/collectivites/tags/personne-tag.dropdown';
import { getPersonneStringId } from '@/app/collectivites/tags/personnes.utils';
import { createDemarchePcaet } from '@/app/demarches/pcaet/demarche-pcaet.storage';
import type { DemarchePcaetObligation } from '@/app/demarches/pcaet/demarche-pcaet.types';
import { appLabels } from '@/app/labels/catalog';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { PersonneTagOrUser } from '@tet/domain/collectivites';
import { Button, Field, Input, Select, Textarea } from '@tet/ui';
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
      className="max-w-2xl mx-auto flex flex-col gap-6 py-8"
      data-test="CreateDemarchePcaet"
    >
      <div className="bg-white rounded-lg border border-grey-3 p-8 flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold text-primary-9 mt-4">
            {appLabels.demarchePcaetCreerTitre}
          </h1>
          <p className="text-sm text-grey-7 mt-2">
            {appLabels.demarchePcaetCreerDescription}
          </p>
        </div>

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

          <Field title="Pilotes (optionnel)">
            <PersonneTagDropdown
              dataTest="demarche-create-pilotes"
              collectiviteIds={[collectiviteId]}
              values={pilotes.map((p) => getPersonneStringId(p))}
              placeholder="Rechercher un pilote…"
              onChange={({ personnes }) =>
                setPilotes(personnes.map((p) => ({ ...p, nom: p.nom ?? '' })))
              }
            />
          </Field>

          <Field title="Description rapide (optionnel)">
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
            />
          </Field>

          <div className="flex justify-end gap-3">
            <Button
              type="submit"
              variant="primary"
              icon="arrow-right-line"
              iconPosition="right"
            >
              Créer la démarche
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
