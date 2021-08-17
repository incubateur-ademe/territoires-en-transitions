import {actions} from './actions';
import {effects} from './effects';
import {state} from './state';
import {createOvermind, IContext} from 'overmind';
import {
  createActionsHook,
  createEffectsHook,
  createReactionHook,
  createStateHook,
} from 'overmind-react';
import type {Effects} from './effects';
import type {State} from './state';

export const config = {
  state: state,
  actions: actions,
  effects: effects,
};

export const overmind = createOvermind(config, {devtools: false});

export type Context = IContext<typeof config>;

export const useAppState = createStateHook<Context>();
export const useActions = createActionsHook<Context>();
export const useEffects = createEffectsHook<Context>();
export const useReaction = createReactionHook<Context>();

export type {State, Effects};
