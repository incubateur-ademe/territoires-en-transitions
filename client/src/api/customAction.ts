import type {Storable} from './store'

export interface CustomAction extends Storable{
    id: string,
    mesureId: string,
    name: string,
    description: string,
}
