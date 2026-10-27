import {
  Component,
  ComponentType,
  createElement,
  ErrorInfo,
  ReactElement,
  ReactNode,
} from 'react';
import { createRoot } from 'react-dom/client';
import { toStoryLabel } from './components';

/*
 * Rejoue les stories Storybook (CSF 3) dans les aperçus du design system
 * publié : args et render de la story ou du meta, décorateurs, sans les
 * fonctions `play`. Compilé dans le bundle, sous `TeT.__preview`.
 */

type Args = Readonly<Record<string, unknown>>;

type StoryContext = Readonly<{
  args: Args;
  argTypes: Args;
  parameters: Args;
  globals: Args;
  viewMode: 'story';
}>;

type Render = (args: Args, context: StoryContext) => ReactNode;

type Decorator = (story: ComponentType, context: StoryContext) => ReactNode;

type StoryAnnotations = Readonly<{
  name?: string;
  args?: Args;
  parameters?: Args;
  render?: Render;
  decorators?: ReadonlyArray<Decorator>;
  component?: ComponentType<Args>;
}>;

export type StoryModule = Readonly<
  Record<string, unknown> & { default: StoryAnnotations }
>;

export type ComposedStory = Readonly<{ label: string; Story: ComponentType }>;

const isStoryExport = ([name, value]: [string, unknown]): boolean =>
  name !== 'default' &&
  !name.startsWith('__') &&
  typeof value === 'object' &&
  value !== null;

export const composeStory = (
  meta: StoryAnnotations,
  story: StoryAnnotations
): ComponentType => {
  const args: Args = { ...meta.args, ...story.args };
  const context: StoryContext = {
    args,
    argTypes: {},
    parameters: { ...meta.parameters, ...story.parameters },
    globals: {},
    viewMode: 'story',
  };
  const target = story.component ?? meta.component;
  const render: Render =
    story.render ??
    meta.render ??
    ((renderArgs) => (target ? createElement(target, renderArgs) : null));

  const decorators = [...(story.decorators ?? []), ...(meta.decorators ?? [])];
  const Base: ComponentType = () => <>{render(args, context)}</>;
  return decorators.reduce<ComponentType>((Inner, decorator) => {
    const Decorated: ComponentType = () => <>{decorator(Inner, context)}</>;
    return Decorated;
  }, Base);
};

/** Stories d'un module, dans l'ordre de déclaration donné (`exportOrder`). */
export const composeStories = (
  module: StoryModule,
  exportOrder: ReadonlyArray<string>
): ReadonlyArray<ComposedStory> =>
  exportOrder
    .map((exportName) => [exportName, module[exportName]] as [string, unknown])
    .filter(isStoryExport)
    .map(([exportName, story]) => {
      const annotations = story as StoryAnnotations;
      return {
        label: annotations.name ?? toStoryLabel(exportName),
        Story: composeStory(module.default, annotations),
      };
    });

type BoundaryState = Readonly<{ error: Error | null }>;

/** Une story qui échoue s'affiche en erreur sans masquer les autres. */
class StoryBoundary extends Component<{ children: ReactNode }, BoundaryState> {
  state: BoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): BoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error(error, info.componentStack);
  }

  render(): ReactNode {
    return this.state.error ? (
      <p style={{ color: 'var(--error-1)', fontSize: 14 }}>
        Aperçu indisponible : {this.state.error.message}
      </p>
    ) : (
      this.props.children
    );
  }
}

const StoryList = ({
  stories,
}: {
  stories: ReadonlyArray<ComposedStory>;
}): ReactElement => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 24,
      padding: 16,
    }}
  >
    {stories.map(({ label, Story }) => (
      <section key={label}>
        <p
          style={{
            margin: '0 0 8px',
            fontSize: 12,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            color: 'var(--grey-8)',
          }}
        >
          {label}
        </p>
        <StoryBoundary>
          <Story />
        </StoryBoundary>
      </section>
    ))}
  </div>
);

/** Monte les stories d'un composant dans `element` (appelé par preview.html). */
export const renderStories = (
  element: Element,
  stories: ReadonlyArray<ComposedStory>
): void => {
  createRoot(element).render(<StoryList stories={stories} />);
};
