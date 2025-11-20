import { createContext, ReactNode, useContext, useReducer } from 'react';

import { RouterInput, RouterOutput } from '@/api/utils/trpc/client';

type Action =
  | {
      type: 'create';
      payload: RouterOutput['plans']['fiches']['etapes']['upsert'];
    }
  | {
      type: 'toggleRealise';
      payload: {
        etapeId: number;
      };
    }
  | {
      type: 'updateNom';
      payload: {
        etapeId: number;
        nom: string;
      };
    }
  | {
      type: 'updateOrder';
      payload: {
        etapeId: number;
        oldOrder: number;
        newOrder: number;
      };
    }
  | {
      type: 'delete';
      payload: RouterInput['plans']['fiches']['etapes']['delete'];
    };

type State = {
  etapes: RouterOutput['plans']['fiches']['etapes']['list'];
};

type Dispatch = (action: Action) => void;

const StateContext = createContext<State | undefined>(undefined);
const DispatchContext = createContext<Dispatch | undefined>(undefined);

const etapesReducer = (state: State, action: Action) => {
  const { etapes } = state;
  switch (action.type) {
    case 'create': {
      const { payload: newEtape } = action;
      return {
        ...state,
        etapes: [...etapes, newEtape],
      };
    }
    case 'toggleRealise': {
      const { etapeId } = action.payload;
      return {
        ...state,
        etapes: etapes.map((etape) =>
          etapeId === etape.id ? { ...etape, realise: !etape.realise } : etape
        ),
      };
    }
    case 'updateNom': {
      const { etapeId, nom: newNom } = action.payload;
      return {
        ...state,
        etapes: etapes.map((etape) =>
          etapeId === etape.id ? { ...etape, nom: newNom } : etape
        ),
      };
    }
    case 'updateOrder': {
      const { etapeId, oldOrder, newOrder } = action.payload;
      return {
        ...state,
        etapes: [
          ...etapes.map((e) => {
            if (e.id === etapeId) {
              return { ...e, ordre: newOrder };
            }
            if (e.ordre > oldOrder && e.ordre <= newOrder) {
              return { ...e, ordre: e.ordre - 1 };
            }
            if (e.ordre < oldOrder && e.ordre >= newOrder) {
              return { ...e, ordre: e.ordre + 1 };
            }
            return e;
          }),
        ].sort((a, b) => a.ordre - b.ordre),
      };
    }
    case 'delete': {
      const { etapeId } = action.payload;

      const etapeOrder = etapes.find((etape) => etape.id === etapeId)?.ordre;

      const filteredEtapes = etapes.filter((etape) => etape.id !== etapeId);

      return {
        ...state,
        etapes: etapeOrder
          ? filteredEtapes.map((e) => {
              if (e.ordre > etapeOrder) {
                return { ...e, ordre: e.ordre - 1 };
              }
              return e;
            })
          : filteredEtapes,
      };
    }
    default:
      return state;
  }
};

export const EtapesProvider = ({
  initialState,
  children,
}: {
  initialState: State;
  children: ReactNode;
}) => {
  const [state, dispatch] = useReducer(etapesReducer, initialState);
  return (
    <StateContext.Provider value={state}>
      <DispatchContext.Provider value={dispatch}>
        {children}
      </DispatchContext.Provider>
    </StateContext.Provider>
  );
};

export const useEtapesState = () => {
  const context = useContext(StateContext);

  if (context === undefined) {
    throw new Error('useEtapesState must be used within a EtapesProvider');
  }
  return context;
};

export const useEtapesDispatch = () => {
  const context = useContext(DispatchContext);

  if (context === undefined) {
    throw new Error('useEtapesDispatch must be used within a EtapesProvider');
  }
  return context;
};
