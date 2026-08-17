import { RuleTester } from 'eslint';
import tseslint from 'typescript-eslint';
import noHardcodedAppPath from './no-hardcoded-app-path.mjs';

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tseslint.parser,
    ecmaVersion: 2022,
    sourceType: 'module',
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

ruleTester.run('no-hardcoded-app-path', noHardcodedAppPath, {
  valid: [
    {
      code: `const url = makeCollectivitePlansActionsListUrl({ collectiviteId });`,
    },
    { code: 'const url = `${finaliserMonInscriptionUrl}?error=invitation`;' },
    { code: `const url = signInPath;` },
    { code: `const externalUrl = 'https://www.ademe.fr/collectivite/1';` },
    { code: `const mail = 'mailto:contact@ademe.fr';` },
    { code: `const anchor = '#indicateurs';` },
    { code: `const home = '/';` },
    { code: `const logo = '/logo.svg';` },
    { code: `const backendRoute = '/plan/export';` },
    { code: `const backendRoute = '/collectivites/1/plans/import-ia';` },
    {
      code: 'const backendRoute = `/collectivites/${collectiviteId}/documents/${documentId}/download`;',
    },
    { code: `const storagePrefix = '/storage/v1/object/sign/';` },
    { code: `const isActionPath = path.includes('/action/');` },
  ],
  invalid: [
    {
      code: 'router.replace(`/collectivite/${collectiviteId}/plans`);',
      errors: [{ messageId: 'hardcodedAppPath' }],
    },
    {
      code: `const link = <Button href="/login" />;`,
      errors: [{ messageId: 'hardcodedAppPath' }],
    },
    {
      code: 'redirect(`/finaliser-mon-inscription?error=invitation`);',
      errors: [{ messageId: 'hardcodedAppPath' }],
    },
    {
      code: `const url = '/collectivite/' + collectiviteId + '/plans';`,
      errors: [
        { messageId: 'hardcodedAppPath' },
        { messageId: 'hardcodedAppPath' },
      ],
    },
    {
      code: `router.push('/profil');`,
      errors: [{ messageId: 'hardcodedAppPath' }],
    },
    {
      code: `const base = '/collectivite';`,
      errors: [{ messageId: 'hardcodedAppPath' }],
    },
    {
      code: `const withAnchor = '/recherches#collectivites';`,
      errors: [{ messageId: 'hardcodedAppPath' }],
    },
  ],
});
