import { appLabels } from '@/app/labels/catalog';
import { referentielToName } from '@/app/app/labels';
import { TLabellisationParcours } from '@/app/referentiels/labellisations/types';
import PreuveDoc from '@/app/referentiels/preuves/Bibliotheque/PreuveDoc';
import { TPreuveLabellisation } from '@/app/referentiels/preuves/Bibliotheque/types';
import { InlineLink } from '@tet/ui';
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
  const { demande, etoiles } = parcours;

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
  const { referentiel, etoiles } = parcours;

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

const MessageECi2Plus = (props: TCriterePreuvesProps) => {
  const { referentiel } = props.parcours;
  return (
    <>
      <li className="mb-2">{appLabels.labellisationAjouterDocumentsOfficielsCandidature}</li>
      <ul>
        <li>
          <b>{appLabels.labellisationCourrierActeCandidatureLabel}</b>
          {appLabels.labellisationCourrierActeCandidatureDescription({
            referentielName: referentielToName[referentiel],
          })}
        </li>
        <li>
          <b>{appLabels.labellisationArretePrefectoralEpciLabel}</b>{appLabels.labellisationArretePrefectoralEpciDescription}
        </li>
        <MessageParDefaut {...props} />
      </ul>
    </>
  );
};

const MessageCAE35Plus = () => {
  return (
    <>
      <li className="mb-2">{appLabels.labellisationAjouterDocumentsOfficielsCandidature}</li>
      <ul>
        <li>
          <b>{appLabels.labellisationDossierDemandeLabel}</b>{appLabels.labellisationDossierDemandeDescription}
        </li>
        <li>
          <b>{appLabels.labellisationAutresDocumentsAnnexesLabel}</b>{appLabels.labellisationAutresDocumentsAnnexesDescription}
        </li>
      </ul>
    </>
  );
};

const MessageParDefaut = (props: TCriterePreuvesProps) => {
  const { referentiel } = props.parcours;
  return (
    <li className="mb-2">
      {appLabels.labellisationSignerActeEngagementDebut}
      <InlineLink href="/Acte_engagement.docx" openInNewTab>
        {appLabels.labellisationActeEngagementLien}
      </InlineLink>
      {appLabels.labellisationActeEngagementAdhesion}
      <InlineLink href={REGLEMENTS[referentiel]} openInNewTab>
        {appLabels.labellisationReglementDuLabel}
      </InlineLink>
    </li>
  );
};

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
