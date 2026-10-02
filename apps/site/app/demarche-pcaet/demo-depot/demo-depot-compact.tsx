import { Confettis } from '@/site/components/demo-animee/confettis';
import { CurseurDemo } from '@/site/components/demo-animee/curseur-demo';
import styles from '@/site/components/demo-animee/demo-animee.module.css';
import { getJalonCourant } from '@/site/components/demo-animee/timeline';
import { TerritoiresEnTransitionsLogo } from '@tet/ui';
import classNames from 'classnames';
import { ReactNode } from 'react';
import {
  BadgeRecu,
  BadgeStatutVolet,
  BadgeTypeDocument,
  BandeauAdopte,
  BoutonFactice,
  Coche,
  Enveloppe,
  IconePdf,
  Interrupteur,
  PastilleEtape,
  VerificationPlan,
  ZoneImport,
} from './demo-depot.elements';
import { EtatDemoDepot } from './demo-depot.etat';
import { ANNEES_DIAGNOSTIC, CURSEUR } from './demo-depot.scenario';

export const SCENE_COMPACTE = { largeur: 360, hauteur: 580 };

/** Seules la première et la dernière année tiennent sur un écran de mobile. */
const ANNEES_AFFICHEES = [0, ANNEES_DIAGNOSTIC.length - 1];
const GRILLE_DIAGNOSTIC = 'grid grid-cols-[minmax(0,1fr)_62px_62px]';

const Ecran = ({ titre, children }: { titre: string; children: ReactNode }) => (
  <div
    className={classNames(
      'absolute inset-0 flex flex-col gap-2.5 p-3.5',
      styles.fondu
    )}
  >
    <h3 className="m-0 text-base font-bold text-primary-9">{titre}</h3>
    {children}
  </div>
);

const Carte = ({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) => (
  <div
    className={classNames(
      'bg-white border border-primary-3 rounded-lg',
      className
    )}
  >
    {children}
  </div>
);

const EcranDocuments = ({ etat }: { etat: EtatDemoDepot }) => {
  const toutesIncluses = etat.inclusions.faites === etat.inclusions.total;
  return (
    <Ecran titre="Ajouter les documents attendus">
      {etat.documents
        .filter(({ depot }) => depot)
        .map((document) => (
          <Carte
            key={document.nom}
            className="flex flex-col gap-2 min-h-[62px] px-3 py-2.5"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[13px] font-bold text-primary-9 line-clamp-1">
                {document.nom}
              </span>
              <BadgeTypeDocument
                obligatoire={document.obligatoire}
                taille="xs"
              />
            </div>
            {document.phase === 'vide' && (
              <span className="self-start px-2 py-[3px] border border-primary-9 rounded text-[11px] font-bold text-primary-9">
                + Déposer un document
              </span>
            )}
            {document.phase === 'vol' && (
              <span
                className={classNames(
                  'self-start flex items-center gap-1.5 px-2 py-[3px] bg-white border border-primary-3 rounded-md shadow-[0_8px_18px_rgba(64,64,146,0.2)] text-[11px]',
                  styles.vol
                )}
              >
                <IconePdf className="w-3 h-[15px] text-[4px]" />
                {document.depot?.fichier}
              </span>
            )}
            {document.phase === 'envoi' && (
              <span className="flex h-1 overflow-hidden rounded-sm bg-primary-2">
                <span
                  className="h-full bg-primary-7"
                  style={{ width: `${document.progression * 100}%` }}
                />
              </span>
            )}
            {document.phase === 'depose' && (
              <span className="flex items-center gap-1.5 text-xs text-primary-9">
                <Coche className="size-[13px]" />
                <span className="underline">{document.depot?.fichier}</span>
              </span>
            )}
          </Carte>
        ))}
      <Carte className="flex items-center justify-between gap-2 px-3 py-2.5">
        <span className="flex flex-col">
          <span className="text-[13px] font-bold text-primary-9">
            Pièces obligatoires
          </span>
          <span className="text-[11px] text-grey-8">
            Incluses dans « PCAET global »
          </span>
        </span>
        <span
          className={classNames(
            'flex items-center gap-1.5 text-[13px] font-bold tabular-nums',
            toutesIncluses ? 'text-success-1' : 'text-primary-9'
          )}
        >
          {etat.inclusions.faites}/{etat.inclusions.total}
          {toutesIncluses && <Coche className="size-4" />}
        </span>
      </Carte>
    </Ecran>
  );
};

const EcranDiagnostic = ({ etat }: { etat: EtatDemoDepot }) => (
  <Ecran titre="Diagnostic et objectifs">
    <div className="grid grid-cols-3 gap-1.5">
      {etat.volets.map((volet) => (
        <div
          key={volet.nom}
          className={classNames(
            'flex flex-col items-center justify-between h-[52px] px-1 py-[5px] text-center bg-white rounded-md',
            volet.actif
              ? 'border-2 border-primary-9'
              : 'border border-primary-3'
          )}
        >
          <span
            className={classNames(
              'text-[10px] leading-tight text-primary-9',
              volet.actif ? 'font-bold' : 'font-medium'
            )}
          >
            {volet.court}
          </span>
          <BadgeStatutVolet statut={volet.statut} taille="xs" />
        </div>
      ))}
    </div>
    <Carte className="overflow-hidden">
      <div
        className={classNames(
          GRILLE_DIAGNOSTIC,
          'items-center h-7 text-[11px] font-bold border-b border-primary-2'
        )}
      >
        <span className="px-2.5 truncate text-primary-9">
          {etat.voletActif.court} ({etat.voletActif.unite})
        </span>
        {ANNEES_AFFICHEES.map((index) => (
          <span key={index} className="px-2">
            {ANNEES_DIAGNOSTIC[index]}
          </span>
        ))}
      </div>
      {etat.lignes.map((ligne) => (
        <div
          key={ligne.secteur}
          className={classNames(
            GRILLE_DIAGNOSTIC,
            'items-center h-6 text-[11px] border-t border-primary-1'
          )}
        >
          <span className="flex items-center justify-between gap-1.5 px-2.5 overflow-hidden whitespace-nowrap">
            <span className="truncate">{ligne.secteur}</span>
            <Interrupteur actif={ligne.active} className="w-6 h-3.5" />
          </span>
          {ANNEES_AFFICHEES.map((index) => {
            const cellule = ligne.cellules[index];
            return (
              <span
                key={index}
                className={classNames(
                  'px-2 tabular-nums',
                  cellule.enSaisie
                    ? 'font-bold text-primary-7'
                    : 'text-primary-10'
                )}
              >
                {cellule.texte}
              </span>
            );
          })}
        </div>
      ))}
    </Carte>
  </Ecran>
);

const EcranProgramme = ({ etat }: { etat: EtatDemoDepot }) => (
  <Ecran titre="Programme d'actions">
    <ZoneImport phase={etat.programme.phaseImport} compact />
    {etat.programme.planRattache ? (
      <Carte className={classNames('flex flex-col gap-2 p-3', styles.glisse)}>
        <span className="text-[13px] font-bold text-primary-9">
          Programme d&apos;actions – PCAET
        </span>
        <div className="flex items-center justify-between">
          <span className="text-xs text-grey-8 tabular-nums">
            {etat.programme.nombreActions} actions
          </span>
          <span
            className={classNames(
              'flex items-center gap-1.5 text-[11px] font-bold',
              etat.programme.verifie ? 'text-success-1' : 'text-grey-8'
            )}
          >
            <VerificationPlan verifie={etat.programme.verifie} />
            Plan vérifié
          </span>
        </div>
      </Carte>
    ) : (
      <Carte className="px-3 py-3.5 text-xs text-grey-8">
        Aucun plan rattaché pour le moment.
      </Carte>
    )}
  </Ecran>
);

const EcranAvis = ({ etat }: { etat: EtatDemoDepot }) => (
  <Ecran titre={etat.avis.titre}>
    <p className="m-0 text-xs text-grey-8">{etat.avis.sousTitre}</p>
    <Carte className="relative flex-none h-[130px] overflow-hidden rounded-[10px]">
      {etat.avis.courrierArrive && (
        <Enveloppe
          ouverte={etat.avis.courrierOuvert}
          rapport={etat.avis.rapportSortant?.rapport}
          compact
        />
      )}
    </Carte>
    {etat.avis.recus.map((avis) =>
      avis.recu ? (
        <Carte
          key={avis.fichier}
          className={classNames(
            'flex flex-none items-center gap-2.5 h-12 px-3',
            styles.glisse
          )}
        >
          <IconePdf className="w-4 h-5 text-[5px]" />
          <span className="flex-1 text-[13px] font-bold text-primary-9">
            {avis.fichier}
          </span>
          <BadgeRecu taille="xs" />
        </Carte>
      ) : (
        <div
          key={avis.fichier}
          className="flex flex-none items-center h-12 px-3 text-xs text-grey-8 border border-dashed border-primary-4 rounded-lg"
        >
          En attente de l&apos;avis de {avis.emetteur}…
        </div>
      )
    )}
    {etat.avis.adopte && <BandeauAdopte compact />}
  </Ecran>
);

const ECRANS_COMPACTS = {
  documents: EcranDocuments,
  diagnostic: EcranDiagnostic,
  programme: EcranProgramme,
  avis: EcranAvis,
};

/** En-tête de la scène mobile : frise des étapes et sous-étapes en cours. */
const Avancement = ({ etat }: { etat: EtatDemoDepot }) => (
  <div className="flex flex-col gap-2 h-[84px] px-3.5 py-2.5 bg-white border-b border-primary-3">
    <div className="flex items-center">
      {etat.etapes.map((etape, index) => {
        const derniere = index === etat.etapes.length - 1;
        return (
          <div
            key={etape.titre}
            className={classNames(
              'flex items-center',
              derniere ? 'flex-none' : 'flex-1'
            )}
          >
            <PastilleEtape
              etat={etape.etat}
              numero={index + 1}
              className="size-[22px] text-[11px]"
            />
            {!derniere && (
              <span
                className={classNames(
                  'flex-1 h-0.5 mx-1.5 transition-colors duration-300',
                  etape.etat === 'faite' ? 'bg-success-1' : 'bg-primary-3'
                )}
              />
            )}
          </div>
        );
      })}
    </div>
    <div className="flex items-center justify-between gap-2">
      <span className="text-[13px] font-bold text-primary-9">
        {etat.etapeCourante.titre}
      </span>
      {etat.enElaboration && (
        <div className="flex gap-1">
          {etat.sousEtapes.map((sousEtape) => (
            <span
              key={sousEtape.court}
              className={classNames(
                'px-1.5 py-0.5 rounded-lg border text-[9px] font-bold transition-colors duration-200',
                sousEtape.faite
                  ? 'border-success-1 bg-success-2 text-success-1'
                  : sousEtape.courante
                  ? 'border-primary-9 bg-primary-2 text-primary-9'
                  : 'border-primary-4 bg-white text-primary-9'
              )}
            >
              {sousEtape.court}
            </span>
          ))}
        </div>
      )}
    </div>
  </div>
);

/** Scène mobile : un écran à la fois, sous la frise des étapes. */
export const DemoDepotCompact = ({
  etat,
  temps,
}: {
  etat: EtatDemoDepot;
  temps: number;
}) => {
  const EcranCourant = ECRANS_COMPACTS[etat.ecran];
  const curseur = getJalonCourant(CURSEUR.compact, temps);
  const { boutonPrincipal } = etat;

  return (
    <div className="relative size-full bg-grey-2 text-[13px] leading-snug text-primary-10">
      <div className="flex items-center gap-2.5 h-9 px-3.5 bg-white border-b border-primary-3">
        <TerritoiresEnTransitionsLogo className="h-6 w-auto" />
        <span className="text-xs text-grey-8">› Démarche PCAET</span>
      </div>
      <Avancement etat={etat} />

      <div className="absolute left-0 top-[120px] w-[360px] h-[460px]">
        <EcranCourant key={etat.ecran} etat={etat} />
        {boutonPrincipal.visible && (
          <BoutonFactice
            actif={boutonPrincipal.actif}
            appuye={etat.clic}
            className={classNames(
              'absolute inset-x-3.5 bottom-3.5 h-10 text-sm',
              styles.fondu
            )}
          >
            {boutonPrincipal.libelle} →
          </BoutonFactice>
        )}
      </div>

      {etat.confettis && (
        <Confettis
          x={180}
          y={300}
          echelle={{ taille: 0.8, dx: 0.5, dy: 0.6 }}
        />
      )}
      <CurseurDemo
        x={curseur.x}
        y={curseur.y}
        visible={curseur.visible}
        appuye={etat.clic}
        variante="tactile"
      />
    </div>
  );
};
