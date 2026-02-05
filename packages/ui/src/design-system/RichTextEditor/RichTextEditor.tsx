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
import { useCreateBlockNote } from '@blocknote/react';
import { useEffect, useState } from 'react';
import { useDebouncedCallback } from 'use-debounce';

import { cn } from '../../utils/cn';
import { TextPlaceholder } from '../TextPlaceholder/TextPlaceholder';
import { ENABLED_ITEMS, FormattingToolbar } from './FormattingToolbar';
import { SuggestionMenu } from './SuggestionMenu';

type RichTextEditorProps = {
  className?: string;
  id?: string;
  initialValue?: string;
  placeholder?: string;
  disabled?: boolean;
  isLoading?: boolean;
  /** Délai en ms pour appeler moins systématiquement le `onChange` */
  debounceDelayOnChange?: number;
  onChange?: (html: string) => void;
  /** Appelé quand l'affichage du contenu initial est tronqué (par une règle css max-height) */
  setIsTruncated?: (truncated: boolean) => void;
  contentStyle?: {
    size?: 'xs' | 'sm' | 'base' | 'md' | 'lg';
    color?: 'white' | 'grey' | 'primary';
  };
  unstyled?: boolean;
  onBlur?: () => void;
};

// utilisé pour convertir en html les liens présents dans les contenus texte existants
const CONTAINS_HTML_URL = /<a\s[^>]*href="[^"]*"[^>]*>(.*?)<\/a>/;
const CONVERT_URL = {
  searchValue:
    /(https?):\/\/([\da-z.-]+\.[a-z.]+|[\d.]+)([/:?=&#]{1}[\da-z.-]+)*[/?]?/gim,
  replaceValue:
    '<a href="$&" target="_blank" rel="noopener noreferrer nofollow">$&</a>',
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
  placeholder,
  disabled = false,
  isLoading = false,
  debounceDelayOnChange = 0,
  onChange,
  setIsTruncated,
  contentStyle,
  unstyled = false,
  onBlur,
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
        // force l'activation du correcteur orthographique du navigateur ?
        spellcheck: 'true',
        class: cn(
          // (le `!outline-none` est requis pour annuler une règle du dsfr)
          '!outline-none',
          unstyled
            ? '!p-0'
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

  // pour éviter que le onChange soit appelé lors de la 1ère initialisation du contenu
  const [isContentInitialized, setIsContentInitialized] = useState(false);

  // écrase le contenu quand la valeur initiale change
  useEffect(() => {
    async function setInitialContent() {
      if (initialValue) {
        // si le texte initial ne contient pas de liens HTML
        if (!initialValue.match(CONTAINS_HTML_URL)) {
          // on remplace les éventuelles URLs présentes par des tags HTML
          initialValue = initialValue.replaceAll(
            CONVERT_URL.searchValue,
            CONVERT_URL.replaceValue
          );
        }

        // essaye de faire le parsing html
        const blocks = await editor.tryParseHTMLToBlocks(
          // en conservant les éventuels sauts de lignes initiaux
          initialValue.replaceAll('\n', '<br />')
        );
        editor.replaceBlocks(editor.document, blocks);

        if (editor.domElement && setIsTruncated) {
          const isTruncated =
            editor.domElement.scrollHeight > editor.domElement.offsetHeight;
          setIsTruncated(isTruncated);
        }
      }
    }
    setInitialContent();
  }, [editor, initialValue]);

  const handleChange = useDebouncedCallback(async () => {
    if (onChange) {
      const html = await editor.blocksToHTMLLossy(editor.document);
      // on ajoute un espace insécable dans les paragraphes vides pour ne pas
      // perdre les sauts de lignes
      const content = html.replaceAll(
        editorOptions.domAttributes?.inlineContent?.class
          ? `<p class="${editorOptions.domAttributes.inlineContent.class}"></p>`
          : '<p></p>',
        '<p>&nbsp;</p>'
      );
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
      id={id}
      editor={editor}
      theme="light"
      formattingToolbar={false}
      slashMenu={false}
      sideMenu={false}
      editable={!disabled}
      onBlur={onBlur}
      onChange={(ed, { getChanges }) => {
        const changes = getChanges();
        // appelle le callback seulement la 1ère initialisation du contenu
        // chargé ou si la source de la modif est autre que "local" (notamment
        // un copier-coller alors que le champ est initialement vide)
        if (isContentInitialized || changes?.[0].source.type !== 'local') {
          handleChange();
        } else {
          setIsContentInitialized(true);
        }
      }}
    >
      <FormattingToolbar editor={editor} />
      <SuggestionMenu editor={editor} />
    </BlockNoteView>
  );
}
