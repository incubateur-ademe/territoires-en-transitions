import {expect} from 'chai'
import { LocalStore} from "../../src/api/localStore";
import {it} from "mocha";
import {IndicateurValueStorable} from "../../src/storables/IndicateurValueStorable";
import {IndicateurValue, IndicateurValueInterface} from "../../vendors/indicateur_value";

export const indicateurValueStore = new LocalStore<IndicateurValueStorable>({
    pathname: IndicateurValue.pathname,
    serializer: (storable) => storable,
    deserializer: (serialized) => new IndicateurValueStorable(serialized as IndicateurValueInterface),
});


const storables = [
    new IndicateurValueStorable({epci_id: 'Alice', indicateur_id: 'Dinah', year: 2049, value: 'Mouse',}),
    new IndicateurValueStorable({epci_id: 'King of Hearts', indicateur_id: 'Dodo', year: 2077, value: 'White Rabbit',}),
]

const fillStore = () => {
    console.log('fill')
    for (let value of storables) {
        indicateurValueStore.store(value)
    }
}

const clear = () => {
    console.log('clear')
    localStorage.clear()
}


describe('Indicateur values store', function () {
    describe('retrieve all', function () {
        describe('when empty', function () {
            it('returns an empty list', function () {
                expect(indicateurValueStore.retrieveAll()).to.be.empty
            })
        })

        describe('when not empty', function () {
            before(fillStore)
            after(clear)
            it('returns the stored elements', function () {
                const retrieved = indicateurValueStore.retrieveAll()
                for (let value of storables) {
                    expect(retrieved).to.deep.contain(value)
                }
            })
        })
    })

    describe('retrieve by id', function () {
        describe('when empty', function () {
            it('throws an error', function () {
                expect(() => indicateurValueStore.retrieveById('bad_id')).to.throw()
            })
        })

        describe('when not empty', function () {
            before(fillStore)
            after(clear)
            it('returns an existing element by its id', function () {
                expect(() => indicateurValueStore.retrieveById(storables[0].id)).to.not.throw()
                expect(indicateurValueStore.retrieveById(storables[0].id)).to.deep.equal(storables[0])
            })
        })
    })

    describe('delete by id', function () {
        describe('when empty', function () {
            it('returns false', function () {
                expect(indicateurValueStore.deleteById('bad_id')).to.be.false
            })
        })

        describe('when not empty', function () {
            before(fillStore)
            after(clear)
            it('returns true on delete and then throws on retrieve', function () {
                expect(indicateurValueStore.deleteById(storables[0].id)).to.be.true
                expect(() => indicateurValueStore.retrieveById(storables[0].id)).to.throw()
            })
        })
    })

    describe('where', function () {
        before(fillStore)
        after(clear)
        it('returns an empty array on no match', function () {
            expect(indicateurValueStore.where(_ => false)).to.be.empty
        })


        it('returns all the store with an always true predicate', function () {
            const retrieved = indicateurValueStore.where(_ => true)
            for (let value of storables) {
                expect(retrieved).to.deep.contain(value)
            }
        })

        it('returns the right result on a value match', function () {
            const retrieved = indicateurValueStore.where(indicateur => indicateur.value == 'Mouse')
            expect(retrieved).to.deep.contain(storables[0])
            expect(retrieved.length).to.equal(1)
        })
    })
})