import { EpciStorable } from "storables/EpciStorable";

export type State = {
  epciId?: string;
  epciDataIsLoading: boolean;
  allEpcis: EpciStorable[];
};

export const state: State = {
  epciId: undefined,
  epciDataIsLoading: false,
  allEpcis: [],
};
