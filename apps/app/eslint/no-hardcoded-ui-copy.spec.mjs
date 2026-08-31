import { RuleTester } from 'eslint';
import { describe, it } from 'vitest';
import { noHardcodedUiCopyRule } from './no-hardcoded-ui-copy.mjs';

RuleTester.describe = describe;
RuleTester.it = it;
RuleTester.itOnly = it.only;

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

const error = { messageId: 'hardcoded' };

ruleTester.run('no-hardcoded-ui-copy', noHardcodedUiCopyRule, {
  valid: [
    { code: '<Button title={appLabels.valider} />' },
    { code: '<Field label={appLabels.nomPlan} />' },
    { code: '<Input placeholder={appLabels.rechercher} />' },
    { code: '<img alt={appLabels.document()} />' },
    { code: '<Button aria-label={appLabels.fermer} />' },
    { code: '<Button ariaLabel={appLabels.fermer} />' },
    { code: '<EmptyCard emptyTitle={appLabels.sansPlanCardTitle} />' },
    { code: '<span title={`${appLabels.valider} :`} />' },
    { code: '<span title="-">-</span>' },
    { code: '<span title="%">%</span>' },
    { code: '<span title="€">€</span>' },
    { code: '<span title="+">+</span>' },
    { code: '<Button variant="primary" size="md" className="flex" />' },
    { code: '<div data-test="plans.fiches.create" id="root" />' },
    { code: '<a href="/plans" />' },
    { code: 'useMutation({ meta: { success: appLabels.planSupprime } })' },
    { code: 'useMutation({ meta: { error: appLabels.mutationError } })' },
    { code: 'useMutation({ meta: { disableToast: true } })' },
    { code: "const payload = { success: 'not-a-toast', error: 'code' }" },
    { code: "z.string().min(1, 'Le nom du plan est requis')" },
  ],
  invalid: [
    {
      code: '<Field title="Échéance" />',
      errors: [error],
    },
    {
      code: '<Input placeholder="Filtrer" />',
      errors: [error],
    },
    {
      code: '<Checkbox label="L\'action se répète tous les ans" />',
      errors: [error],
    },
    {
      code: '<Field hint="Texte d\'aide" message="Erreur" />',
      errors: [error, error],
    },
    {
      code: '<Alert description="Compléter le diagnostic" />',
      errors: [error],
    },
    {
      code: '<img alt="Graphique des scores" />',
      errors: [error],
    },
    {
      code: '<Button aria-label="Fermer le panneau" />',
      errors: [error],
    },
    {
      code: '<Button ariaLabel="Fermer le panneau" />',
      errors: [error],
    },
    {
      code: '<Icon tooltip="Modifier l\'action" />',
      errors: [error],
    },
    {
      code: '<Select tooltipLabel="Filtrer sur le statut" />',
      errors: [error],
    },
    {
      code: '<EmptyCard emptyTitle="Aucun plan" emptyDescription="Créer un plan" />',
      errors: [error, error],
    },
    {
      code: '<Panel closeLabel="Fermer" />',
      errors: [error],
    },
    {
      code: '<fieldset legend="Période" />',
      errors: [error],
    },
    {
      code: '<Field title={"Échéance"} />',
      errors: [error],
    },
    {
      code: '<span title={`Rejoindre ${nom}`} />',
      errors: [error],
    },
  ],
});
