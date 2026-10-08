import { makeCollectiviteActionUrl } from '@/app/app/paths';
import { appLabels } from '@/app/labels/catalog';
import { useGetFiche } from '@/app/plans/fiches/data/use-get-fiche';
import {
  isFicheEditableByCollectiviteUser,
  isFicheSharedWithCollectivite,
} from '@/app/plans/fiches/share-fiche/share-fiche.utils';
import { useGetFicheSecteurs } from '@/app/plans/fiches/show-fiche/data/use-get-fiche-secteurs';
import { useUpsertFicheSecteurs } from '@/app/plans/fiches/show-fiche/data/use-upsert-fiche-secteurs';
import { generateTitle } from '@/app/utils/generate-title';
import { useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { useUser } from '@tet/api/users';
import {
  SecteurReglementaire,
  secteurReglementaireEnumValues,
} from '@tet/domain/plans';
import { Button, Icon, InlineLink } from '@tet/ui';
import { cn } from '@tet/ui/utils/cn';
import { useEffect, useState } from 'react';
import { FicheSecteursAVerifier } from './data/use-list-plan-fiches-secteurs-a-verifier';

const isARenseigner = (fiche: FicheSecteursAVerifier) =>
  fiche.etat === 'a_renseigner' || fiche.etat === 'non_attribuable';

export const toFichesAVerifier = (fiches: FicheSecteursAVerifier[]) =>
  fiches.filter(isARenseigner);

export const PlanSecteursVerificationPanel = ({
  planId,
  fiches,
}: {
  planId: number;
  fiches: FicheSecteursAVerifier[];
}) => {
  const [index, setIndex] = useState<number | null>(null);
  const [verifiees, setVerifiees] = useState<Set<number>>(new Set());

  const marquerVerifiee = (ficheId: number) =>
    setVerifiees((current) => new Set(current).add(ficheId));

  if (index === null) {
    return (
      <ListeFiches fiches={fiches} verifiees={verifiees} onSelect={setIndex} />
    );
  }

  return (
    <RevueFiche
      key={fiches[index].ficheId}
      planId={planId}
      fiche={fiches[index]}
      index={index}
      total={fiches.length}
      isVerifiee={verifiees.has(fiches[index].ficheId)}
      onNavigate={setIndex}
      onRetour={() => setIndex(null)}
      onEnregistree={() => {
        marquerVerifiee(fiches[index].ficheId);
        setIndex(index + 1 < fiches.length ? index + 1 : null);
      }}
    />
  );
};

const TitreFiche = ({
  fiche,
  className,
}: {
  fiche: FicheSecteursAVerifier;
  className?: string;
}) => (
  <span className={cn('min-w-0', className)}>
    {fiche.parentId !== null && (
      <span className="text-grey-7">
        {generateTitle(fiche.parentTitre)}
        <Icon icon="arrow-right-s-line" size="xs" className="mx-1" />
      </span>
    )}
    {generateTitle(fiche.titre)}
  </span>
);

const ListeFiches = ({
  fiches,
  verifiees,
  onSelect,
}: {
  fiches: FicheSecteursAVerifier[];
  verifiees: Set<number>;
  onSelect: (index: number) => void;
}) => (
  <div
    className="flex flex-col gap-6 p-4"
    data-test="plans.secteurs-counts-alert.liste"
  >
    {[
      { etat: 'a_renseigner', titre: appLabels.planSecteursGroupeARenseigner },
    ].map(({ etat, titre }) => {
      const fichesDuGroupe = fiches
        .map((fiche, index) => ({ fiche, index }))
        .filter(({ fiche }) => isARenseigner(fiche));
      if (fichesDuGroupe.length === 0) {
        return null;
      }
      return (
        <section key={etat} className="flex flex-col gap-2">
          <h3 className="mb-0 text-sm font-bold text-primary-10">
            {titre}
            <span className="ml-2 font-normal text-grey-7">
              {fichesDuGroupe.length}
            </span>
          </h3>
          <ul className="mb-0 pl-0 list-none border-t border-grey-3">
            {fichesDuGroupe.map(({ fiche, index }) => (
              <li key={fiche.ficheId} className="border-b border-grey-3">
                <button
                  type="button"
                  className="w-full flex items-center justify-between gap-3 py-3 text-left text-sm text-primary-10 hover:bg-primary-1"
                  onClick={() => onSelect(index)}
                  data-test="plans.secteurs-counts-alert.fiche"
                >
                  <TitreFiche fiche={fiche} />
                  {verifiees.has(fiche.ficheId) ? (
                    <Icon
                      icon="check-line"
                      size="sm"
                      className="shrink-0 text-success-1"
                    />
                  ) : (
                    <Icon
                      icon="arrow-right-s-line"
                      size="sm"
                      className="shrink-0 text-grey-6"
                    />
                  )}
                </button>
              </li>
            ))}
          </ul>
        </section>
      );
    })}
  </div>
);

const RevueFiche = ({
  planId,
  fiche,
  index,
  total,
  isVerifiee,
  onNavigate,
  onRetour,
  onEnregistree,
}: {
  planId: number;
  fiche: FicheSecteursAVerifier;
  index: number;
  total: number;
  isVerifiee: boolean;
  onNavigate: (index: number) => void;
  onRetour: () => void;
  onEnregistree: () => void;
}) => {
  const collectivite = useCurrentCollectivite();
  const user = useUser();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { data: ficheComplete } = useGetFiche({ id: fiche.ficheId });
  const { data: secteurs } = useGetFicheSecteurs(fiche.ficheId);
  const { mutate: upsertSecteurs, isPending } = useUpsertFicheSecteurs(
    fiche.ficheId
  );
  const [selection, setSelection] = useState<SecteurReglementaire[]>([]);

  useEffect(() => {
    setSelection(secteurs?.etat === 'attribue' ? secteurs.secteurs : []);
  }, [secteurs]);

  const isReadonly =
    !ficheComplete ||
    !isFicheEditableByCollectiviteUser(ficheComplete, collectivite, user.id) ||
    isFicheSharedWithCollectivite(ficheComplete, collectivite.collectiviteId);

  const enregistrer = (secteursChoisis: SecteurReglementaire[]) =>
    upsertSecteurs(
      {
        ficheId: fiche.ficheId,
        secteurs: secteurReglementaireEnumValues.filter((secteur) =>
          secteursChoisis.includes(secteur)
        ),
      },
      {
        onSuccess: () => {
          void queryClient.invalidateQueries({
            queryKey: trpc.plans.fiches.listPlanSecteursCounts.pathKey(),
          });
          void queryClient.invalidateQueries({
            queryKey:
              trpc.plans.fiches.listPlanFichesSecteursAVerifier.pathKey(),
          });
          onEnregistree();
        },
      }
    );

  const basculer = (secteur: SecteurReglementaire) =>
    setSelection((current) =>
      current.includes(secteur)
        ? current.filter((value) => value !== secteur)
        : [...current, secteur]
    );

  const ficheUrl =
    fiche.parentId === null
      ? makeCollectiviteActionUrl({
          collectiviteId: collectivite.collectiviteId,
          ficheUid: fiche.ficheId.toString(),
          planId,
        })
      : makeCollectiviteActionUrl({
          collectiviteId: collectivite.collectiviteId,
          ficheUid: fiche.parentId.toString(),
          content: 'sous-actions',
        });

  return (
    <div
      className="flex flex-col gap-6 p-4"
      data-test="plans.secteurs-counts-alert.revue"
    >
      <div className="flex items-center justify-between gap-2">
        <Button
          size="xs"
          variant="grey"
          icon="arrow-left-line"
          onClick={onRetour}
        >
          {appLabels.planSecteursRetourListe}
        </Button>
        <div className="flex items-center gap-2 text-sm text-grey-7">
          {appLabels.planSecteursPosition({ index: index + 1, total })}
          <Button
            size="xs"
            variant="grey"
            icon="arrow-left-s-line"
            title={appLabels.planSecteursPrecedente}
            disabled={index === 0}
            onClick={() => onNavigate(index - 1)}
          />
          <Button
            size="xs"
            variant="grey"
            icon="arrow-right-s-line"
            title={appLabels.planSecteursSuivante}
            disabled={index + 1 >= total}
            onClick={() => onNavigate(index + 1)}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <p className="mb-0 text-xs font-medium uppercase text-grey-7">
          {appLabels.planSecteursGroupeARenseigner}
          {isVerifiee && (
            <span className="ml-2 normal-case text-success-1">
              {appLabels.planSecteursVerifiee}
            </span>
          )}
        </p>
        <h3 className="mb-0 text-base font-bold text-primary-10">
          <TitreFiche fiche={fiche} />
        </h3>
        {ficheComplete?.description && (
          <p className="mb-0 text-sm text-grey-8 line-clamp-4">
            {ficheComplete.description}
          </p>
        )}
        <InlineLink
          href={ficheUrl}
          className="self-start text-sm text-primary-9"
        >
          {appLabels.planSecteursOuvrirFiche}
        </InlineLink>
      </div>

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-3 text-sm font-bold text-primary-10">
          {appLabels.ficheSecteursReglementaires}
        </legend>
        <div className="flex flex-wrap gap-2">
          {secteurReglementaireEnumValues.map((secteur) => {
            const isSelected = selection.includes(secteur);
            return (
              <button
                key={secteur}
                type="button"
                aria-pressed={isSelected}
                disabled={isReadonly}
                onClick={() => basculer(secteur)}
                className={cn(
                  'flex items-center gap-1 rounded-full border px-3 py-1 text-sm transition-colors',
                  isSelected
                    ? 'border-primary-9 bg-primary-9 text-white'
                    : 'border-grey-4 bg-white text-primary-10 hover:border-primary-9',
                  isReadonly && 'cursor-not-allowed opacity-60'
                )}
                data-test={`plans.secteurs-counts-alert.secteur.${secteur}`}
              >
                {isSelected && <Icon icon="check-line" size="xs" />}
                {appLabels.ficheSecteurReglementaireLabels[secteur]}
              </button>
            );
          })}
        </div>
        {isReadonly && (
          <p className="mb-0 text-xs text-grey-7">
            {appLabels.planSecteursLectureSeule}
          </p>
        )}
      </fieldset>

      {!isReadonly && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-grey-3 pt-4">
          <Button
            size="sm"
            variant="outlined"
            disabled={isPending}
            onClick={() => enregistrer([])}
            dataTest="plans.secteurs-counts-alert.non-attribuable"
          >
            {appLabels.planSecteursNonAttribuable}
          </Button>
          <Button
            size="sm"
            disabled={isPending || selection.length === 0}
            onClick={() => enregistrer(selection)}
            dataTest="plans.secteurs-counts-alert.enregistrer"
          >
            {index + 1 < total
              ? appLabels.planSecteursEnregistrerEtSuivante
              : appLabels.planSecteursEnregistrer}
          </Button>
        </div>
      )}
    </div>
  );
};
