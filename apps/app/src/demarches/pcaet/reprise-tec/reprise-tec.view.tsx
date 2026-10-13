'use client';

import { appLabels } from '@/app/labels/catalog';
import {
  EmptyCard,
  Input,
  PageHeader,
  Table,
  TableCell,
  TableEmpty,
  TableHead,
  TableHeaderCell,
  TableLoading,
  TableRow,
} from '@tet/ui';
import { parseAsString, useQueryState } from 'nuqs';
import { filterCollectivites } from './data/filter-collectivites';
import { useListCollectivites } from './data/use-list-collectivites';

const COLUMN_IDS = ['tec', 'tet', 'siren', 'territoire', 'population'];

export const RepriseTecView = () => {
  const { data, isLoading, error } = useListCollectivites();
  const [recherche, setRecherche] = useQueryState(
    'q',
    parseAsString.withDefault('').withOptions({ history: 'replace' })
  );

  const collectivites = filterCollectivites(data ?? [], recherche);

  return (
    <div data-test="admin.reprise-tec.view">
      <PageHeader className="mb-6">
        <PageHeader.Title>{appLabels.repriseTec}</PageHeader.Title>
        <PageHeader.Subtitle>
          <p className="mb-0 text-sm leading-[22px] text-grey-8">
            {appLabels.repriseTecSousTitre}
          </p>
        </PageHeader.Subtitle>
      </PageHeader>

      {error?.data?.code === 'PRECONDITION_FAILED' ? (
        <EmptyCard
          dataTest="admin.reprise-tec.recette-non-construite"
          title={appLabels.repriseTecRecetteNonConstruite}
          description={appLabels.repriseTecRecetteNonConstruiteDescription}
        />
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-4">
            <Input
              type="search"
              data-test="admin.reprise-tec.recherche"
              containerClassname="w-full max-w-md"
              displaySize="sm"
              placeholder={appLabels.repriseTecRechercher}
              value={recherche}
              onChange={(e) => setRecherche(e.target.value || null)}
              onSearch={(v) => setRecherche(v || null)}
            />
            {data && (
              <span className="text-sm text-grey-8">
                {appLabels.repriseTecNombreCollectivites({
                  count: collectivites.length,
                })}
              </span>
            )}
          </div>
          <div className="rounded-xl border border-grey-3 overflow-hidden">
            <Table data-test="admin.reprise-tec.collectivites">
              <TableHead>
                <TableRow>
                  <TableHeaderCell
                    title={appLabels.repriseTecColonneCollectiviteTec}
                  />
                  <TableHeaderCell
                    title={appLabels.repriseTecColonneCollectiviteTet}
                  />
                  <TableHeaderCell
                    title={appLabels.repriseTecColonneSiren}
                    className="w-32"
                  />
                  <TableHeaderCell
                    title={appLabels.repriseTecColonneTerritoire}
                  />
                  <TableHeaderCell
                    title={appLabels.repriseTecColonnePopulation}
                    className="w-32"
                  />
                </TableRow>
              </TableHead>
              <tbody>
                {isLoading ? (
                  <TableLoading columnIds={COLUMN_IDS} />
                ) : collectivites.length === 0 ? (
                  <TableEmpty
                    columnIds={COLUMN_IDS}
                    title={appLabels.repriseTecAucunResultat}
                  />
                ) : (
                  collectivites.map((c) => (
                    <TableRow
                      key={c.tecCollectiviteId}
                      data-test={`admin.reprise-tec.collectivite-${c.tecCollectiviteId}`}
                    >
                      <TableCell>
                        <div className="font-medium text-primary-10">
                          {c.nom}
                        </div>
                        <div className="text-xs text-grey-7">
                          {appLabels.repriseTecIdTec(c.tecCollectiviteId)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {c.collectiviteId === null ? (
                          <span className="text-error-1">
                            {appLabels.repriseTecIntrouvableDansTet}
                          </span>
                        ) : (
                          <>
                            <div>{c.nomTet}</div>
                            <div className="text-xs text-grey-7">
                              {appLabels.repriseTecIdTet(c.collectiviteId)}
                            </div>
                          </>
                        )}
                      </TableCell>
                      <TableCell>{c.siren}</TableCell>
                      <TableCell>
                        <div>{c.departement}</div>
                        <div className="text-xs text-grey-7">{c.region}</div>
                      </TableCell>
                      <TableCell>
                        {c.population?.toLocaleString('fr-FR')}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </tbody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
};
