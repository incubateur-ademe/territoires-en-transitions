import { appLabels } from '@/app/labels/catalog';

export type MailTemplate = {
  subject: string;
  body: string;
  typeAuditLabel: string;
};

export const getMailTemplateToCopyPaste = ({
  demandeId,
  referentielNom,
  collectiviteNom,
}: {
  demandeId: number | null;
  referentielNom: string;
  collectiviteNom: string;
}): MailTemplate => {
  const typeAuditLabel =
    demandeId === null
      ? appLabels.typeAuditSansLabellisation
      : appLabels.typeAuditDeLabellisation;

  return {
    typeAuditLabel,
    subject: appLabels.mailClotureAuditObjet({
      typeAudit: typeAuditLabel,
      referentielNom,
      collectiviteNom,
    }),
    body: appLabels.mailClotureAuditContenu({
      typeAudit: typeAuditLabel,
      referentielNom,
      collectiviteNom,
    }),
  };
};
