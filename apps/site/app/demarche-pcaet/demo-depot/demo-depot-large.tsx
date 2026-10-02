import { Confettis } from '@/site/components/demo-animee/confettis';
import { CurseurDemo } from '@/site/components/demo-animee/curseur-demo';
import styles from '@/site/components/demo-animee/demo-animee.module.css';
import { getJalonCourant } from '@/site/components/demo-animee/timeline';
import { Icon, TerritoiresEnTransitionsLogo } from '@tet/ui';
import classNames from 'classnames';
import { ReactNode } from 'react';
import {
  BadgeRecu,
  BadgeStatutVolet,
  BadgeTypeDocument,
  BandeauAdopte,
  BoutonFactice,
  CaseACocher,
  Coche,
  Enveloppe,
  IconePdf,
  Interrupteur,
  NiveauVulnerabilite,
  PastilleEtape,
  VerificationPlan,
  ZoneImport,
} from './demo-depot.elements';
import { EtatDemoDepot } from './demo-depot.etat';
import {
  ANNEES_DIAGNOSTIC,
  CURSEUR,
  VULNERABILITE,
} from './demo-depot.scenario';

export const SCENE_LARGE = { largeur: 1200, hauteur: 720 };

const GRILLE_DOCUMENTS = 'grid grid-cols-[120px_minmax(0,1fr)_270px]';
const GRILLE_DIAGNOSTIC = 'grid grid-cols-[270px_repeat(4,minmax(0,1fr))]';
const GRILLE_PLANS = 'grid grid-cols-[minmax(0,1fr)_170px_150px]';

const Ecran = ({
  titre,
  sousTitre,
  pied,
  children,
}: {
  titre: string;
  sousTitre: string;
  pied: ReactNode;
  children: ReactNode;
}) => (
  <div
    className={classNames(
      'absolute inset-0 flex flex-col gap-3.5 px-6 py-[22px]',
      styles.fondu
    )}
  >
    <div>
      <h3 className="m-0 text-xl font-bold text-primary-9">{titre}</h3>
      <p className="m-0 mt-1 text-[13px] text-grey-8">{sousTitre}</p>
    </div>
    {children}
    <div className="absolute inset-x-6 bottom-5 flex justify-between min-h-[41px] pt-3 border-t border-primary-3">
      {pied}
    </div>
  </div>
);

const BoutonSuivant = ({
  libelle,
  actif = true,
  appuye,
}: {
  libelle: string;
  actif?: boolean;
  appuye: boolean;
}) => (
  <BoutonFactice
    actif={actif}
    appuye={appuye}
    className="ml-auto px-[18px] py-2.5 text-sm"
  >
    {libelle} <Icon icon="arrow-right-line" size="sm" />
  </BoutonFactice>
);

const BoutonPrecedent = () => (
  <BoutonFactice variante="secondaire" className="px-4 py-[9px] text-sm">
    <Icon icon="arrow-left-line" size="sm" /> Étape précédente
  </BoutonFactice>
);

const EcranDocuments = ({ etat }: { etat: EtatDemoDepot }) => (
  <Ecran
    titre="Ajouter les documents attendus"
    sousTitre="Déposer les pièces usuelles attendues."
    pied={<BoutonSuivant libelle="Étape suivante" appuye={etat.clic} />}
  >
    <div className="overflow-hidden bg-white border border-primary-3 rounded-lg">
      <div
        className={classNames(
          GRILLE_DOCUMENTS,
          'items-center h-[34px] text-[11px] font-bold tracking-wide text-primary-10 [&>span]:px-3.5'
        )}
      >
        <span>TYPE</span>
        <span>NOM DU DOCUMENT</span>
        <span>DOCUMENTS LIÉS</span>
      </div>
      {etat.documents.map((document) => (
        <div
          key={document.nom}
          className={classNames(
            GRILLE_DOCUMENTS,
            'min-h-[42px] border-t border-primary-2'
          )}
        >
          <div className="flex items-center px-3.5 border-r border-primary-2">
            <BadgeTypeDocument obligatoire={document.obligatoire} />
          </div>
          <div className="flex flex-col justify-center gap-0.5 px-3.5 py-1.5">
            <span className="text-[13px] font-medium text-primary-9">
              {document.nom}
            </span>
            {document.description && (
              <span className="text-[11px] text-grey-8">
                {document.description}
              </span>
            )}
          </div>
          <div className="flex items-center px-3.5 py-1.5 border-l border-primary-2">
            <CelluleDocument document={document} />
          </div>
        </div>
      ))}
    </div>
  </Ecran>
);

const CelluleDocument = ({
  document,
}: {
  document: EtatDemoDepot['documents'][number];
}) => {
  if (!document.depot) {
    return (
      <span className="flex items-center gap-2 text-xs text-primary-9">
        <CaseACocher cochee={document.inclus} className="size-4" />
        Inclus dans « PCAET global »
      </span>
    );
  }
  const { fichier } = document.depot;
  switch (document.phase) {
    case 'vide':
      return (
        <span className="px-2.5 py-1 border border-primary-9 rounded text-xs font-bold text-primary-9">
          + Déposer un document
        </span>
      );
    case 'vol':
      return (
        <span
          className={classNames(
            'flex items-center gap-1.5 px-2 py-1 bg-white border border-primary-3 rounded-md shadow-[0_8px_18px_rgba(64,64,146,0.2)] text-xs font-medium',
            styles.vol
          )}
        >
          <IconePdf className="w-3.5 h-[18px] text-[5px]" />
          {fichier}
        </span>
      );
    case 'envoi':
      return (
        <span className="flex flex-col flex-1 gap-1">
          <span className="text-xs text-primary-10">{fichier}</span>
          <span className="flex h-1 overflow-hidden rounded-sm bg-primary-2">
            <span
              className="h-full bg-primary-7"
              style={{ width: `${document.progression * 100}%` }}
            />
          </span>
        </span>
      );
    default:
      return (
        <span
          className={classNames(
            'flex items-center gap-2 text-[13px] text-primary-9',
            styles.fondu
          )}
        >
          <Coche className="size-[13px]" />
          <span className="underline">{fichier}</span>
        </span>
      );
  }
};

const EcranDiagnostic = ({ etat }: { etat: EtatDemoDepot }) => (
  <Ecran
    titre="Compléter le diagnostic et les objectifs"
    sousTitre="Consultez et complétez les indicateurs par volet du PCAET."
    pied={
      <>
        <BoutonPrecedent />
        <BoutonSuivant libelle="Étape suivante" appuye={etat.clic} />
      </>
    }
  >
    <div className="grid grid-cols-6 gap-2.5">
      {etat.volets.map((volet) => (
        <div
          key={volet.nom}
          className={classNames(
            'flex flex-col items-center justify-between h-24 px-1.5 py-2.5 text-center bg-white rounded-lg',
            volet.actif
              ? 'border-2 border-primary-9'
              : 'border border-primary-3'
          )}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-primary-9"
          >
            <path d={volet.icone} />
          </svg>
          <span
            className={classNames(
              'text-[11px] leading-tight text-primary-9',
              volet.actif ? 'font-bold' : 'font-medium'
            )}
          >
            {volet.nom}
          </span>
          <BadgeStatutVolet statut={volet.statut} />
        </div>
      ))}
    </div>
    {etat.vulnerabilite ? (
      <TableauVulnerabilite thematiques={etat.vulnerabilite} />
    ) : (
      <TableauIndicateurs voletActif={etat.voletActif} lignes={etat.lignes} />
    )}
  </Ecran>
);

const TableauIndicateurs = ({
  voletActif,
  lignes,
}: Pick<EtatDemoDepot, 'voletActif' | 'lignes'>) => (
  <div className="overflow-hidden bg-white border border-primary-3 rounded-lg">
    <div
      className={classNames(
        GRILLE_DIAGNOSTIC,
        'items-center h-10 text-[13px] font-bold border-b border-primary-2 [&>span]:px-3.5'
      )}
    >
      <span className="text-primary-9">
        {voletActif.nom} ({voletActif.unite})
      </span>
      {ANNEES_DIAGNOSTIC.map((annee, index) => (
        <span key={annee} className="flex items-center gap-1.5">
          {index === 0 && (
            <span className="px-[3px] border border-primary-4 rounded-[3px] text-[8px] text-grey-8">
              RÉF.
            </span>
          )}
          {annee}
        </span>
      ))}
    </div>
    {lignes.map((ligne) => (
      <div
        key={ligne.secteur}
        className={classNames(
          GRILLE_DIAGNOSTIC,
          'items-center h-[35px] border-t border-primary-1'
        )}
      >
        <span className="flex items-center justify-between h-full px-3.5 text-xs text-primary-10 border-r border-primary-1">
          {ligne.secteur}
          <Interrupteur actif={ligne.active} className="w-8 h-[18px]" />
        </span>
        {ligne.cellules.map((cellule, colonne) => (
          <span
            key={colonne}
            className={classNames(
              'flex items-center gap-1.5 px-3.5 text-[13px] tabular-nums',
              cellule.enSaisie ? 'font-bold text-primary-7' : 'text-primary-10'
            )}
          >
            <span
              className={classNames(
                'flex items-center justify-center size-3 border border-primary-4 text-[8px] text-primary-7',
                colonne === 0 ? 'rounded-[3px]' : 'rounded-full'
              )}
            >
              {colonne === 0 ? 'R' : 'O'}
            </span>
            {cellule.texte}
          </span>
        ))}
      </div>
    ))}
  </div>
);

const GRILLE_VULNERABILITE =
  'grid grid-cols-[170px_repeat(3,minmax(0,1fr))_170px]';

/** Longueur finale de chaque objectif « écrit », pour varier les lignes. */
const LONGUEURS_OBJECTIF = [85, 70, 95, 75, 90, 65, 80, 72];

/** Objectif en cours d'écriture : une ligne squelette qui s'allonge. */
const ObjectifEcrit = ({
  progression,
  longueur,
}: {
  progression: number;
  longueur: number;
}) =>
  progression === 0 ? (
    <span className="text-[13px] text-grey-8">Saisir vos objectifs</span>
  ) : (
    <span className="flex items-center gap-0.5">
      <span
        className="h-2 rounded-full bg-primary-3"
        style={{ width: `${progression * longueur}%` }}
      />
      {progression < 1 && (
        <span className="w-0.5 h-3.5 bg-primary-7 animate-pulse" />
      )}
    </span>
  );

/** Volet vulnérabilité : des niveaux par thématique, comme dans l'app. */
const TableauVulnerabilite = ({
  thematiques,
}: {
  thematiques: NonNullable<EtatDemoDepot['vulnerabilite']>;
}) => (
  <div className="overflow-hidden bg-white border border-primary-3 rounded-lg">
    <div
      className={classNames(
        GRILLE_VULNERABILITE,
        'items-center h-12 text-[11px] font-bold leading-tight tracking-wide text-primary-10 border-b border-primary-2 [&>span]:px-3.5'
      )}
    >
      <span>THÉMATIQUES</span>
      {VULNERABILITE.horizons.map((horizon) => (
        <span key={horizon}>
          VULNÉRABILITÉ
          <br />
          {horizon.toUpperCase()}
        </span>
      ))}
      <span>OBJECTIFS 2050</span>
    </div>
    {thematiques.map((thematique, ligne) => (
      <div
        key={thematique.nom}
        className={classNames(
          GRILLE_VULNERABILITE,
          'items-center h-[35px] border-t border-primary-1 [&>span]:px-3.5'
        )}
      >
        <span className="text-[13px] font-medium text-primary-9">
          {thematique.nom}
        </span>
        {thematique.niveaux.map((niveau, horizon) => (
          <span key={horizon}>
            <NiveauVulnerabilite niveau={niveau} />
          </span>
        ))}
        <span>
          <ObjectifEcrit
            progression={thematique.objectif}
            longueur={LONGUEURS_OBJECTIF[ligne]}
          />
        </span>
      </div>
    ))}
  </div>
);

const EcranProgramme = ({ etat }: { etat: EtatDemoDepot }) => (
  <Ecran
    titre="Renseigner le programme d'actions"
    sousTitre="Liez votre programme d'actions à un plan de la plateforme, créez-en un ou importez-le."
    pied={
      <>
        <BoutonPrecedent />
        <BoutonSuivant
          libelle="Valider le dépôt pour avis"
          actif={etat.programme.validable}
          appuye={etat.clic}
        />
      </>
    }
  >
    <BoutonFactice className="absolute right-6 top-[22px] gap-2 px-3.5 py-[9px] text-[13px]">
      + Créer un plan
      <span className="pl-2 border-l border-white/40">▾</span>
    </BoutonFactice>
    <ZoneImport phase={etat.programme.phaseImport} compact={false} />
    <div className="overflow-hidden bg-white border border-primary-3 rounded-lg">
      <div
        className={classNames(
          GRILLE_PLANS,
          'items-center h-9 text-[11px] font-bold tracking-wide [&>span]:px-4'
        )}
      >
        <span>NOM DU PLAN</span>
        <span>NOMBRE D&apos;ACTIONS</span>
        <span>VÉRIFICATION</span>
      </div>
      {etat.programme.planRattache ? (
        <div
          className={classNames(
            GRILLE_PLANS,
            'items-center h-[52px] bg-primary-0 border-t border-primary-2 [&>span]:px-4',
            styles.glisse
          )}
        >
          <span className="text-sm font-medium text-primary-9">
            Programme d&apos;actions – PCAET
          </span>
          <span className="text-sm text-grey-8 tabular-nums">
            {etat.programme.nombreActions} actions
          </span>
          <span
            className={classNames(
              'flex items-center gap-2 text-xs font-bold',
              etat.programme.verifie ? 'text-success-1' : 'text-grey-8'
            )}
          >
            <VerificationPlan verifie={etat.programme.verifie} />
            Plan vérifié
          </span>
        </div>
      ) : (
        <div className="flex items-center h-[52px] px-4 text-[13px] text-grey-8 border-t border-primary-2">
          Aucun plan rattaché pour le moment.
        </div>
      )}
    </div>
    <div className="flex flex-col gap-1 px-4 py-3.5 rounded-lg bg-info-2">
      <span className="flex items-center gap-1.5 text-[13px] font-bold text-info-1">
        <Icon icon="information-line" size="sm" />
        Vérifiez vos plans avant de valider le dépôt
      </span>
      <span className="text-xs text-primary-10">
        Consultez les actions de chaque plan lié, corrigez-les si besoin, puis
        marquez le plan comme vérifié.
      </span>
    </div>
  </Ecran>
);

const EcranAvis = ({ etat }: { etat: EtatDemoDepot }) => (
  <Ecran
    titre={etat.avis.titre}
    sousTitre={etat.avis.sousTitre}
    pied={
      etat.avis.adoptable && (
        <BoutonFactice
          appuye={etat.clic}
          className={classNames('ml-auto px-5 py-2.5 text-sm', styles.popHalo)}
        >
          Adopter le PCAET
        </BoutonFactice>
      )
    }
  >
    <div className="grid grid-cols-[360px_minmax(0,1fr)] gap-6">
      <div className="relative h-[340px] overflow-hidden bg-white border border-primary-3 rounded-[10px]">
        <span className="absolute left-4 top-3.5 text-[11px] font-bold tracking-wider text-grey-8">
          COURRIER
        </span>
        {etat.avis.courrierArrive && (
          <Enveloppe
            ouverte={etat.avis.courrierOuvert}
            rapport={etat.avis.rapportSortant?.rapport}
            compact={false}
          />
        )}
      </div>
      <div className="flex flex-col gap-3">
        <span className="text-[11px] font-bold tracking-wider text-grey-8">
          AVIS REÇUS
        </span>
        {etat.avis.recus.map((avis) =>
          avis.recu ? (
            <div
              key={avis.fichier}
              className={classNames(
                'flex items-center gap-3 h-16 px-4 bg-white border border-primary-3 rounded-lg',
                styles.glisse
              )}
            >
              <IconePdf className="w-[22px] h-7 text-[6px]" />
              <span className="flex flex-col flex-1">
                <span className="text-sm font-bold text-primary-9">
                  {avis.fichier}
                </span>
                <span className="text-xs text-grey-8">{avis.origine}</span>
              </span>
              <BadgeRecu />
            </div>
          ) : (
            <div
              key={avis.fichier}
              className="flex items-center h-16 px-4 text-[13px] text-grey-8 border border-dashed border-primary-4 rounded-lg"
            >
              En attente de l&apos;avis de {avis.emetteur}…
            </div>
          )
        )}
        {etat.avis.adopte && <BandeauAdopte />}
      </div>
    </div>
  </Ecran>
);

const PanneauAvancement = ({ etat }: { etat: EtatDemoDepot }) => (
  <div className="absolute left-[820px] top-11 flex flex-col gap-1.5 w-[380px] h-[676px] px-[22px] py-5 bg-white border-l border-primary-3">
    <span className="mb-1.5 text-[11px] font-bold tracking-wider text-grey-8">
      AVANCEMENT
    </span>
    {etat.etapes.map((etape, index) => (
      <div
        key={etape.titre}
        className="grid grid-cols-[28px_minmax(0,1fr)] gap-3"
      >
        <div className="flex flex-col items-center">
          <PastilleEtape
            etat={etape.etat}
            numero={index + 1}
            className="size-7 text-[13px]"
          />
          {index < etat.etapes.length - 1 && (
            <span
              className={classNames(
                'flex-1 w-0.5 min-h-3.5 my-1 transition-colors duration-300',
                etape.etat === 'faite' ? 'bg-success-1' : 'bg-primary-3'
              )}
            />
          )}
        </div>
        <div className="flex flex-col gap-1 pb-3">
          <span
            className={classNames(
              'pt-1 text-[15px] leading-snug text-primary-9',
              etape.etat === 'active' ? 'font-bold' : 'font-medium'
            )}
          >
            {etape.titre}
          </span>
          <span
            className={classNames(
              'text-xs leading-normal',
              etape.etat === 'active' ? 'text-primary-10' : 'text-grey-8'
            )}
          >
            {etape.description}
          </span>
          {index === 0 && etape.etat === 'active' && (
            <div className="flex flex-col gap-2 mt-2">
              {etat.sousEtapes.map((sousEtape) => (
                <div
                  key={sousEtape.titre}
                  className={classNames(
                    'grid grid-cols-[24px_minmax(0,1fr)] items-start gap-2.5 bg-white rounded-lg transition-colors duration-200',
                    sousEtape.courante
                      ? 'px-[11px] py-[9px] border-2 border-primary-9'
                      : 'px-3 py-2.5 border border-primary-3'
                  )}
                >
                  {sousEtape.faite ? (
                    <Coche className="size-6" />
                  ) : (
                    <span className="flex items-center justify-center size-6 rounded-full bg-warning-2 text-xs font-bold text-warning-1">
                      ×
                    </span>
                  )}
                  <div className="flex flex-col gap-[3px]">
                    <div className="flex items-start justify-between gap-1.5">
                      <span className="text-xs font-bold leading-tight text-primary-9">
                        {sousEtape.titre}
                      </span>
                      <BadgeStatutVolet
                        statut={sousEtape.faite ? 'complete' : 'a-completer'}
                      />
                    </div>
                    <span className="text-[11px] leading-snug text-grey-8">
                      {sousEtape.description}
                    </span>
                  </div>
                </div>
              ))}
              <BoutonFactice
                actif={etat.programme.validable}
                className="self-start px-3 py-2 text-xs"
              >
                Valider le dépôt pour avis →
              </BoutonFactice>
            </div>
          )}
        </div>
      </div>
    ))}
  </div>
);

const ECRANS_LARGE = {
  documents: EcranDocuments,
  diagnostic: EcranDiagnostic,
  programme: EcranProgramme,
  avis: EcranAvis,
};

/** Scène desktop : l'écran de dépôt à gauche, le panneau Avancement à droite. */
export const DemoDepotLarge = ({
  etat,
  temps,
}: {
  etat: EtatDemoDepot;
  temps: number;
}) => {
  const EcranCourant = ECRANS_LARGE[etat.ecran];
  const curseur = getJalonCourant(CURSEUR.large, temps);

  return (
    <div className="relative size-full bg-grey-2 text-sm leading-[1.45] text-primary-10">
      <div className="flex items-center gap-3.5 h-11 px-5 bg-white border-b border-primary-3">
        <TerritoiresEnTransitionsLogo className="h-[30px] w-auto" />
        <span className="w-px h-5 bg-primary-3" />
        <span className="text-[13px] font-bold text-primary-9">
          Ma collectivité
        </span>
        <span className="text-[13px] text-grey-8">› Démarche PCAET</span>
        <span className="flex items-center justify-center ml-auto size-7 rounded-full bg-primary-2 text-[11px] font-bold text-primary-9">
          CM
        </span>
      </div>

      <div className="absolute left-0 top-11 w-[820px] h-[676px]">
        <EcranCourant key={etat.ecran} etat={etat} />
      </div>
      <PanneauAvancement etat={etat} />

      {etat.confettis && <Confettis x={410} y={360} />}
      <CurseurDemo
        x={curseur.x}
        y={curseur.y}
        visible={curseur.visible}
        transition={curseur.transition}
        appuye={etat.clic}
        variante="souris"
      />
    </div>
  );
};
