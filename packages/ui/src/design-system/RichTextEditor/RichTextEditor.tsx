'use client';

import {
  BlockNoteEditor,
  BlockNoteSchema,
  BlockSchema,
  BlockSpecs,
} from '@blocknote/core';
import { fr as locale } from '@blocknote/core/locales';
import { BlockNoteView } from '@blocknote/mantine';
import '@blocknote/mantine/style.css';
import { useCreateBlockNote, useEditorChange } from '@blocknote/react';
import React, { useEffect } from 'react';
import './rich-text-editor.css';

import { SizeVariant } from '@tet/design-tokens';
import { cn } from '../../utils/cn';
import { TextPlaceholder } from '../TextPlaceholder/TextPlaceholder';
import { ENABLED_ITEMS, FormattingToolbar } from './FormattingToolbar';
import { SuggestionMenu } from './SuggestionMenu';

export type RichTextEditorProps = {
  className?: string;
  id?: string;
  dataTest?: string;
  ariaLabel?: string;
  initialValue?: string;
  placeholder?: string;
  disabled?: boolean;
  isLoading?: boolean;
  onChange?: (html: string) => void;
  contentStyle?: {
    size?: SizeVariant | 'base' | 'md' | 'lg';
    color?: 'white' | 'grey' | 'primary';
  };
  unstyled?: boolean;
  onBlur?: (htmlValue: string) => void;
  OnKeyDownCapture?: (event: React.KeyboardEvent<HTMLDivElement>) => void;
};

// génère le schéma des données gérées par l'éditeur en ne conservant que les
// types de blocs acceptés (permet notamment de complètement désactiver le bloc
// "quote" y compris via les raccourcis TAB ou `>`+ESPACE)
function createEditorSchema() {
  const defaultSchema = BlockNoteSchema.create();

  function filterItems<T extends BlockSchema | BlockSpecs>(obj: T) {
    return Object.fromEntries(
      Object.entries(obj).filter(([key]) => ENABLED_ITEMS.includes(key))
    );
  }

  return {
    ...defaultSchema,
    blockSchema: filterItems(defaultSchema.blockSchema),
    blockSpecs: filterItems(defaultSchema.blockSpecs),
  };
}

export default function RichTextEditor({
  className,
  id,
  initialValue,
  dataTest,
  ariaLabel,
  placeholder,
  disabled = false,
  isLoading = false,
  onChange,
  contentStyle,
  unstyled = false,
  onBlur,
  OnKeyDownCapture,
}: RichTextEditorProps) {
  const { size = 'base', color = 'grey' } = contentStyle ?? {};
  const contentColor = {
    white: 'text-grey-1',
    grey: 'text-grey-8',
    primary: 'text-primary-9',
  }[color];

  const contentSize = {
    xs: 'text-xs',
    sm: 'text-sm',
    base: 'text-base',
    md: 'text-md',
    lg: 'text-lg',
  }[size];

  const editorOptions: BlockNoteEditor['options'] = {
    // schéma de données géré par l'éditeur
    schema: createEditorSchema(),
    // localisation des éléments d'UI de l'éditeur
    dictionary: {
      ...locale,
      placeholders: {
        ...locale.placeholders,
        emptyDocument: placeholder ?? 'Saisissez votre texte',
      },
    },
    // évite l'ajout auto d'un bloc à la fin du champ
    trailingBlock: false,
    // désactive l'ajout de titres lors du copier-coller ou de la saisie des raccourcis MD (###)
    heading: { levels: [] },
    // ajoute des attributs HTML sur les éléments de l'éditeur
    domAttributes: {
      editor: {
        'data-test': dataTest ?? '',
        role: 'textbox',
        'aria-multiline': 'true',
        ...(ariaLabel ? { 'aria-label': ariaLabel } : {}),
        'aria-readonly': disabled ? 'true' : 'false',
        // force l'activation du correcteur orthographique du navigateur ?
        spellcheck: 'true',
        class: cn(
          // (le `!outline-none` est requis pour annuler une règle du dsfr)
          // '!outline-none',
          unstyled
            ? '!p-0 !bg-transparent'
            : '!px-6 py-3 border border-solid rounded-lg bg-grey-1 focus-within:border-primary-5',
          className
        ),
      },
      inlineContent: {
        //"it's a pain but usage of ! is mandatory to override the default blocknote styles"
        class: `!${contentSize} !${contentColor} font-[Marianne]`,
      },
      blockContent: {
        class: '!p-0',
      },
    },
  };

  const editor = useCreateBlockNote(editorOptions, [className]);

  useEffect(() => {
    // Replaces the blocks on initialization
    // But, you can also call this before rendering the editor
    async function loadContent(content: string) {
      const isHtml = content.trim().startsWith('<');

      const blocks = isHtml
        ? await editor.tryParseHTMLToBlocks(content)
        : await editor.tryParseMarkdownToBlocks(content);

      editor.replaceBlocks(editor.document, blocks);
    }

    if (initialValue) {
      loadContent(initialValue);
    }
  }, [editor, initialValue]);

  useEditorChange(async (editor) => {
    const html = await editor.blocksToFullHTML(editor.document);

    onChange?.(html);
  }, editor);

  const handleOnBlur = async (event: React.FocusEvent<HTMLDivElement>) => {
    /**
     * blur event is triggered only when user actually clicks outside of the blocknote editor
     */
    const isBlurTriggeredByElementInsideBlockNote =
      event.currentTarget.contains(event.relatedTarget);
    if (isBlurTriggeredByElementInsideBlockNote) return;

    const html = await editor.blocksToFullHTML(editor.document);

    onBlur?.(html);
  };

  if (isLoading) {
    return (
      <TextPlaceholder className={editorOptions.domAttributes?.editor?.class} />
    );
  }

  return (
    <BlockNoteView
      id={id}
      editor={editor}
      theme="light"
      formattingToolbar={false}
      slashMenu={false}
      sideMenu={false}
      editable={!disabled}
      onKeyDownCapture={OnKeyDownCapture}
      onBlur={handleOnBlur}
    >
      <FormattingToolbar editor={editor} />
      <SuggestionMenu editor={editor} />
    </BlockNoteView>
  );
}
