import { Prefix } from '@/api';
import { TOC_ITEMS } from './action-information.utils';

// type d'info associées à une action
export type TActionInfo = (typeof TOC_ITEMS)[number]['id'];
// et des rpc correspondantes dans la base
export type TRPCName = Prefix<'action_', Exclude<TActionInfo, 'desc'>>;

// item du sommaire
export type TTOCItem = {
  id: TActionInfo;
  label: string;
  num: number;
};
