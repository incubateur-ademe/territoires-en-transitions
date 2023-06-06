import {Prefix} from 'types/utils';
import {TOC_ITEMS} from './toc-items';

// type d'info associées à une action
export type TActionInfo = typeof TOC_ITEMS[number]['id'];
// noms des champs dans l'objet action
export type TFieldName = Prefix<'have_', Exclude<TActionInfo, 'desc'>>;
// et des rpc correspondantes dans la base
export type TRPCName = Prefix<'action_', Exclude<TActionInfo, 'desc'>>;

// item du sommaire
export type TTOCItem = {
  id: TActionInfo;
  label: string;
  num: number;
};
