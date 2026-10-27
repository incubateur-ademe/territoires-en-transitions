import { RuleTester } from 'eslint';
import { describe, expect, it } from 'vitest';
import {
  findClassViolations,
  noLayoutClassesRule,
} from './no-layout-classes.mjs';

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

const layout = (className) => ({ messageId: 'layout', data: { className } });
const arbitrary = (className) => ({
  messageId: 'arbitrary',
  data: { className },
});

describe('findClassViolations', () => {
  it('ignore les classes hors layout', () => {
    expect(
      findClassViolations(
        'text-sm font-bold text-primary-9 rounded-lg border col-span-2 self-start justify-self-end w-full'
      )
    ).toEqual([]);
  });

  it('tolère la remise à zéro des marges et paddings', () => {
    expect(findClassViolations('mb-0 md:p-0 mt-0')).toEqual([]);
  });

  it('signale les classes de layout, variantes et négatifs compris', () => {
    expect(
      findClassViolations(
        'flex md:flex-col gap-4 -mt-2 lg:px-6 items-center justify-between grid-cols-3 !p-2'
      ).map(({ className }) => className)
    ).toEqual([
      'flex',
      'md:flex-col',
      'gap-4',
      '-mt-2',
      'lg:px-6',
      'items-center',
      'justify-between',
      'grid-cols-3',
      '!p-2',
    ]);
  });

  it('signale les valeurs arbitraires, y compris de layout', () => {
    expect(
      findClassViolations('text-[#123456] gap-[13px] [&>svg]:w-4')
    ).toEqual([
      { className: 'text-[#123456]', kind: 'arbitrary' },
      { className: 'gap-[13px]', kind: 'arbitrary' },
      { className: '[&>svg]:w-4', kind: 'arbitrary' },
    ]);
  });
});

ruleTester.run('no-layout-classes', noLayoutClassesRule, {
  valid: [
    {
      code: '<Stack gap="md"><Text className="text-sm text-grey-8" /></Stack>',
    },
    {
      code: '<Box padding="md" className="rounded-lg border border-grey-3 bg-white" />',
    },
    { code: '<div className={cn("text-sm", isActive && "text-primary-9")} />' },
    { code: '<div style={{ width: `${ratio}%` }} />' },
    { code: '<div data-test="flex gap-4" title="p-4" />' },
    {
      code: '<div className="w-[13px]" />',
      options: [{ allowArbitraryValues: true }],
    },
  ],
  invalid: [
    {
      code: '<div className="flex gap-4" />',
      errors: [layout('flex'), layout('gap-4')],
    },
    {
      code: '<div className={cn("text-sm", { "md:px-6": isOpen }, isOpen ? "mt-2" : "")} />',
      errors: [layout('md:px-6'), layout('mt-2')],
    },
    {
      code: '<Card bodyClassName={`items-center ${extra}`} />',
      errors: [layout('items-center')],
    },
    {
      code: '<div className="text-[#ff0000]" />',
      errors: [arbitrary('text-[#ff0000]')],
    },
    {
      code: '<div style={{ marginTop: 12, display: "flex", color: "red" }} />',
      errors: [
        { messageId: 'layoutStyle', data: { property: 'marginTop' } },
        { messageId: 'layoutStyle', data: { property: 'display' } },
      ],
    },
  ],
});
