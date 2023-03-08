export const LocalSelectors = {
  'Demander un audit': {
    selector: '[data-test=SubmitDemandeBtn]',
  },
  "choix du type d'audit/labellisation COT": {
    selector: '[data-test=DemandeAuditModal]',
  },
  'Audit COT sans labellisation': {
    selector: 'input[type=radio][value=cot]',
  },
  'Audit COT avec labellisation': {
    selector: 'input[type=radio][value=labellisation_cot]',
  },
  'Audit de labellisation': {
    selector: 'input[type=radio][value=labellisation]',
  },
  'Demander la 1ère étoile': {
    selector: '[data-test=1ereEtoileCOT]',
  },
  'Envoyer ma demande': {
    selector: '[data-test=EnvoyerDemandeBtn]',
  },
  "message d'en-tête": {
    selector: '[data-test=HeaderMessage]',
  },
  'Ajouter un document de labellisation': {
    selector: '[data-test=AddDocsButton]',
  },
  "dialogue d'envoi de la demande": {
    selector: '[data-test=DemandeLabellisationModal]',
  },
};
