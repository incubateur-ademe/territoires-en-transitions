'use client';

import { BlockNoteEditor } from '@blocknote/core';
import { fr as locale } from '@blocknote/core/locales';
import { BlockNoteView } from '@blocknote/mantine';
import '@blocknote/mantine/style.css';
import { useCreateBlockNote } from '@blocknote/react';
import { useEffect } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import { FormattingToolbar } from './FormattingToolbar';
import { SuggestionMenu } from './SuggestionMenu';

import { TextPlaceholder } from '@/ui/design-system/TextPlaceholder/TextPlaceholder';
import { cn } from '@/ui/utils/cn';

import './styles.css';

export default function RichTextEditor({
  className,
  initialValue,
  placeholder,
  disabled = false,
  isLoading = false,
  debounceDelayOnChange = 0,
  onChange,
}: {
  className?: string;
  style?: string;
  initialValue?: string;
  placeholder?: string;
  disabled?: boolean;
  isLoading?: boolean;
  debounceDelayOnChange?: number;
  onChange?: (html: string) => void;
}) {
  const editorOptions: BlockNoteEditor['options'] = {
    // localisation des éléments d'UI de l'éditeur
    dictionary: {
      ...locale,
      placeholders: {
        ...locale.placeholders,
        emptyDocument: placeholder ?? locale.placeholders.emptyDocument,
      },
    },
    // évite l'ajout auto d'un bloc à la fin du champ
    trailingBlock: false,
    // désactive l'ajout de titres lors du copier-coller ou de la saisie des raccourcis MD (###)
    heading: { levels: [] },
    // ajoute des attributs HTML sur les éléments de l'éditeur
    domAttributes: {
      editor: {
        // force l'activation du correcteur orthographique du navigateur ?
        spellcheck: 'true',
        // styles du container
        // (le `!outline-none` est requis pour annuler une règle du dsfr)
        class: cn(
          '!outline-none min-h-20 !px-6 py-3 border border-solid rounded-lg bg-grey-1 focus-within:border-primary-5 [&_.bn-inline-content]:font-[Marianne]',
          className
        ),
      },
    },
  };

  const editor = useCreateBlockNote(editorOptions, [className]);

  // écrase le contenu quand la valeur initiale change
  useEffect(() => {
    async function setInitialContent() {
      if (initialValue) {
        // le contenu initial peut être en markdown
        let blocks = await editor.tryParseMarkdownToBlocks(initialValue);
        // mais si ce n'est pas le cas (le parsing a donné
        // un bloc de code html ou un paragraphe vide)
        // alors on essaye de faire le parsing html
        if (
          !blocks?.length ||
          blocks[0].type === 'codeBlock' ||
          (Array.isArray(blocks[0].content) && !blocks[0].content.length)
        ) {
          blocks = await editor.tryParseHTMLToBlocks(initialValue);
        }
        editor.replaceBlocks(editor.document, blocks);
      }
    }
    setInitialContent();
  }, [editor, initialValue]);

  const handleChange = useDebouncedCallback(async () => {
    if (onChange) {
      const html = await editor.blocksToHTMLLossy(editor.document);
      // on ajoute un espace insécable dans les paragraphes vides pour ne pas
      // perdre les sauts de lignes
      const content = html.replaceAll('<p></p>', '<p>&nbsp;</p>');
      // mais on évite d'avoir uniquement une ligne vide
      onChange(content === '<p>&nbsp;</p>' ? '' : content);
    }
  }, debounceDelayOnChange);

  if (isLoading) {
    return (
      <TextPlaceholder className={editorOptions.domAttributes?.editor?.class} />
    );
  }

  return (
    <BlockNoteView
      editor={editor}
      theme="light"
      formattingToolbar={false}
      slashMenu={false}
      editable={!disabled}
      onChange={handleChange}
    >
      <FormattingToolbar editor={editor} />
      <SuggestionMenu editor={editor} />
    </BlockNoteView>
  );
}
