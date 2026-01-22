/**
 * Affiche le critère Fichiers
 */
import { referentielToName } from '@/app/app/labels';
import { TLabellisationParcours } from '@/app/referentiels/labellisations/types';
import PreuveDoc from '@/app/referentiels/preuves/Bibliotheque/PreuveDoc';
import { TPreuveLabellisation } from '@/app/referentiels/preuves/Bibliotheque/types';
import { AddDocsButton } from './AddDocsButton';
import { CritereRempli } from './CritereRempli';

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.territoiresentransitions.fr';

const REGLEMENTS: { [k: string]: string } = {
  eci: `${SITE_URL}/fichiers/reglement/ECi_Reglement_label.pdf`,
  cae: `${SITE_URL}/fichiers/reglement/CAE_Reglement_label.pdf`,
};

export type TCriterePreuvesProps = {
  collectiviteId: number;
  parcours: TLabellisationParcours;
  preuves: TPreuveLabellisation[];
  isCOT: boolean;
};

export const CriterePreuves = (props: TCriterePreuvesProps) => {
  const { parcours, preuves, isCOT } = props;
  const { demande, achievableEtoiles: etoiles } = parcours;

  // critère nécessitant l'ajout d'une ou plusieurs preuves
  const rempli = preuves.length > 0;

  if (isCOT && etoiles === 1) {
    return null;
  }

  return (
    <>
      <MessageCriterePreuve {...props} />
      {rempli ? <CritereRempli className="mb-4" /> : null}
      <AddDocsButton />
      {demande ? <LabellisationPreuves {...props} /> : null}
    </>
  );
};

const MessageCriterePreuve = (props: TCriterePreuvesProps) => {
  const { parcours } = props;
  const { referentiel, achievableEtoiles: etoiles } = parcours;

  if (referentiel === 'eci' && etoiles !== 1) {
    return (
      <>
        <MessageECi2Plus {...props} />
      </>
    );
  }

  if (referentiel === 'cae' && parcours.critere_score.score_fait > 0.35) {
    return <MessageCAE35Plus />;
  }

  return <MessageParDefaut {...props} />;
};

// message affiché pour ECi niveau 2+
const MessageECi2Plus = (props: TCriterePreuvesProps) => {
  const { referentiel } = props.parcours;
  return (
    <>
      <li className="mb-2">Ajouter les documents officiels de candidature</li>
      <ul>
        <li>
          <b>Courrier d’acte de candidature</b> : motivation et palier visé,
          précision des compétences, engagement à améliorer de façon continue la
          politique {referentielToName[referentiel]} et coordonnées de la
          personne référente technique
        </li>
        <li>
          <b>Arrêté préfectoral de création de l’EPCI</b> (Établissement public
          de coopération intercommunale)
        </li>
        <MessageParDefaut {...props} />
      </ul>
    </>
  );
};

// message affiché pour CAE score > 35%
const MessageCAE35Plus = () => {
  return (
    <>
      <li className="mb-2">Ajouter les documents officiels de candidature</li>
      <ul>
        <li>
          <b>Dossier de demande de labellisation</b> (et Request for Award pour
          les candidatures 5 étoiles)
        </li>
        <li>
          <b>Autres documents annexes</b> si non renseignés dans la plateforme
          (programme politique - plan d’action, délibération de la politique
          climat air énergie, tableau de recueil des indicateurs…)
        </li>
      </ul>
    </>
  );
};

// message affiché dans tous les cas
const MessageParDefaut = (props: TCriterePreuvesProps) => {
  const { referentiel } = props.parcours;
  return (
    <li className="mb-2">
      Signer un{' '}
      <a href="/Acte_engagement.docx" target="_blank" rel="noopener">
        acte d’engagement
      </a>{' '}
      dans le programme affirmant votre adhésion{' '}
      <a
        href={REGLEMENTS[referentiel]}
        target="_blank"
        rel="noopener noreferrer"
      >
        au règlement du label
      </a>
    </li>
  );
};

/**
 * Affiche les fichiers attachés à la demande
 */
const LabellisationPreuves = (props: TCriterePreuvesProps) => {
  const { preuves, parcours } = props;
  const { demande } = parcours;
  if (!preuves.length) {
    return null;
  }

  return (
    <div className="mt-2" data-test="LabellisationPreuves">
      {preuves.map((preuve) => (
        <PreuveDoc
          key={`${preuve.id}`}
          preuve={preuve}
          readonly={!demande?.en_cours}
          classComment="pb-0 mb-2"
        />
      ))}
    </div>
  );
};
