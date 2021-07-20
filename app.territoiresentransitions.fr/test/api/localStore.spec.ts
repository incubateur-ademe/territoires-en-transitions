import { LocalStore} from "../../src/api/localStore";
import { expect } from 'chai'

describe('LocalStore', () => {
    before(() => {
        localStorage.setItem('BiscuitStore', JSON.stringify({
            'alice-123': {
                id: 'alice-123',
                prenom: 'Alice',
            }
        }))
    })

    describe('retrieveById', () => {
        it('return the matching item', () => {
            const store = new LocalStore<object>({
                pathname: 'BiscuitStore',
                serializer: (storable) => storable,
                deserializer: (serialized) => serialized,
            })

            const alice = store.retrieveById('alice-123')
            expect(alice['id']).to.eq('alice-123')
            expect(alice['prenom']).to.eq('Alice')
        })
    })
})