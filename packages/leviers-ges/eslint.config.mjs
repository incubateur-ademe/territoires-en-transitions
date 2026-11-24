import { builtinModules } from 'node:module'
import tseslint from 'typescript-eslint'
import constantHasSource from './eslint-rules/constant-has-source.mjs'

const localPlugin = { rules: { 'constant-has-source': constantHasSource } }

const nodeBuiltinImports = builtinModules.flatMap((name) => [name, `node:${name}`])

const productionFiles = ['src/**/*.ts']
const testFiles = ['**/*.spec.ts', 'src/testing/**/*.ts']

const leverBarrelPattern = {
  group: ['**/levers/*/*', '!**/levers/*/index.ts'],
  message: 'a lever is imported through its index, which exposes estimate and its input type only.',
}

const aboveApplicationPattern = {
  group: ['**/levers/**', '**/estimator/**'],
  message: 'levers and the estimator sit above this layer: depend on ports instead.',
}

const siblingLeverPattern = {
  regex: '^\\.\\./[^./]',
  message: 'a lever never imports another lever: share through domain or application.',
}

function noIoPaths(owner) {
  return nodeBuiltinImports.map((name) => ({
    name,
    message: `${owner} performs no I/O: put it behind a port.`,
  }))
}

const upperCaseConstantName = '/^[A-Z][A-Z0-9_]*$/'

const floatArithmeticSelectors = [
  {
    selector: 'BinaryExpression[operator=/^(\\+|-|\\*|\\/|%|\\*\\*)$/]',
    message:
      'Arithmetic operators work on floats: compute with BigNumber methods, build text with template literals.',
  },
  {
    selector: 'AssignmentExpression[operator=/^(\\+|-|\\*|\\/|%|\\*\\*)=$/]',
    message: 'Arithmetic operators work on floats: compute with BigNumber methods.',
  },
  {
    selector: 'UpdateExpression',
    message: 'Increment and decrement work on floats: compute with BigNumber methods.',
  },
  {
    selector: 'UnaryExpression[operator=/^(\\+|-)$/]',
    message: 'Unary operators coerce to float: build the value with a named constant.',
  },
  {
    selector: 'CallExpression[callee.name=/^(parseFloat|parseInt|Number)$/]',
    message: 'Parsing to a JavaScript number loses precision: use parseBig.',
  },
  {
    selector: 'CallExpression[callee.object.name="Number"][callee.property.name=/^parse/]',
    message: 'Parsing to a JavaScript number loses precision: use parseBig.',
  },
  {
    selector: 'NewExpression[callee.name="Number"]',
    message: 'Converting to a JavaScript number loses precision: use parseBig.',
  },
  {
    selector: 'MemberExpression[object.name="Math"]',
    message: 'Math works on floats: use BigNumber methods.',
  },
  {
    selector: 'CallExpression[callee.property.name="toNumber"]',
    message: 'toNumber converts to a float: keep the BigNumber.',
  },
]

const bigNumberOperations =
  '/^(plus|minus|times|div|dividedBy|multipliedBy|pow|exponentiatedBy|sqrt|squareRoot|abs|absoluteValue|negated|modulo|mod|remainder|shiftedBy|decimalPlaces|dp|integerValue)$/'

const singleOperationSelectors = [
  {
    selector: `CallExpression[callee.property.name=${bigNumberOperations}] > MemberExpression > CallExpression[callee.property.name=${bigNumberOperations}]`,
    message: 'Chained operations: name each intermediate component before combining them.',
  },
  {
    selector: `CallExpression[callee.property.name=${bigNumberOperations}] > CallExpression[callee.property.name=${bigNumberOperations}]`,
    message: 'Nested operations: name each intermediate component before combining them.',
  },
]

const decimalText = '/^-?\\d+(\\.\\d+)?$/'
const insideUpperCaseConstant = `VariableDeclarator[id.name=${upperCaseConstantName}] *`
const unnamedDecimalMessage =
  'A decimal value must be declared in an UPPER_CASE constant carrying a "// Source :" comment.'

const unnamedDecimalSelectors = [
  {
    selector: `Literal[value=${decimalText}]:not(${insideUpperCaseConstant})`,
    message: unnamedDecimalMessage,
  },
  {
    selector: `TemplateLiteral[quasis.0.value.cooked=${decimalText}]:not(${insideUpperCaseConstant})`,
    message: unnamedDecimalMessage,
  },
]

export default tseslint.config(
  { ignores: ['dist', 'coverage', 'node_modules'] },
  ...tseslint.configs.strictTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
    },
  },
  {
    files: productionFiles,
    ignores: testFiles,
    plugins: { local: localPlugin },
    rules: {
      'local/constant-has-source': 'error',
      '@typescript-eslint/no-magic-numbers': [
        'error',
        {
          ignore: [0, 1],
          ignoreEnums: true,
          ignoreTypeIndexes: true,
          ignoreReadonlyClassProperties: true,
          enforceConst: true,
          detectObjects: true,
        },
      ],
      'no-restricted-syntax': [
        'error',
        ...unnamedDecimalSelectors,
        ...floatArithmeticSelectors,
        ...singleOperationSelectors,
      ],
    },
  },
  {
    files: ['src/domain/**/*.ts'],
    ignores: testFiles,
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            ...noIoPaths('domain'),
            ...['csv-parse', 'csv-parse/sync'].map((name) => ({
              name,
              message: 'domain reads no files: put parsing behind a port.',
            })),
          ],
          patterns: [
            {
              group: ['**/application/**', '**/infrastructure/**', '**/testing/**'],
              message: 'domain depends on nothing: reach other layers through ports.',
            },
            aboveApplicationPattern,
          ],
        },
      ],
    },
  },
  {
    files: ['src/application/**/*.ts'],
    ignores: testFiles,
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: noIoPaths('application'),
          patterns: [
            {
              group: ['**/infrastructure/**', '**/testing/**'],
              message: 'application knows domain and ports only: inject adapters.',
            },
            aboveApplicationPattern,
          ],
        },
      ],
    },
  },
  {
    files: ['src/levers/**/*.ts'],
    ignores: testFiles,
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: noIoPaths('a lever'),
          patterns: [
            {
              group: ['**/infrastructure/**', '**/testing/**', '**/estimator/**'],
              message: 'a lever knows domain and ports only: read data through the context.',
            },
            siblingLeverPattern,
          ],
        },
      ],
    },
  },
  {
    files: ['src/levers/**/calculate-*.ts'],
    ignores: testFiles,
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: noIoPaths('a calculation'),
          patterns: [
            {
              group: [
                '**/application/**',
                '**/infrastructure/**',
                '**/testing/**',
                '**/data-source.ts',
                '**/territory-index.ts',
                '**/estimator/**',
              ],
              message: 'a calculation is pure: it receives values, never a data source.',
            },
            siblingLeverPattern,
          ],
        },
      ],
    },
  },
  {
    files: ['src/infrastructure/**/*.ts'],
    ignores: testFiles,
    rules: {
      'no-restricted-imports': ['error', { patterns: [aboveApplicationPattern] }],
    },
  },
  {
    files: ['src/index.ts'],
    rules: {
      'no-restricted-imports': ['error', { patterns: [leverBarrelPattern] }],
    },
  },
  {
    files: ['**/*.mjs'],
    ...tseslint.configs.disableTypeChecked,
  },
)
