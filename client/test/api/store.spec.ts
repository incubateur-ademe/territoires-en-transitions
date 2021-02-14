import { expect } from 'chai'
import { getStore, setStore } from '../../src/api/store'

describe('getStore', function() {
  describe('when a store with the key territoiresentransition exists', function() {
    before(function() {
      const store = JSON.stringify({
        indicators: {
          '1a': {
            indicator_id: '1a',
            value: '42',
          }
        },
      })
      localStorage.setItem('territoiresentransitions', store)
    })

    it('returns the store saved under the key territoiresentransitions', function() {
      expect(getStore()).to.eql({
        indicators: {
          '1a': {
            indicator_id: '1a',
            value: '42',
          }
        }
      })
    })
  })

  describe('when store is empty', function() {
    it('returns an empty object', function() {
      expect(getStore()).to.eql({})
    })
  })

  afterEach(function(){
    localStorage.clear()
  })
})

describe('setStore', function() {
  it('sets the passed store in localStorage under the key territoiresentransitions', function() {
    const store = {
      indicators: {
        '1a': {
          indicator_id: '1a',
          value: '42',
        }
      }
    }

    setStore(store)

    const savedStore = localStorage.getItem('territoiresentransitions')

    expect(savedStore).to.eql(JSON.stringify(store))
  })

  it('returns the passed store', function() {
    const store = {
      indicators: {
        '1a': {
          indicator_id: '1a',
          value: '42',
        }
      }
    }

    expect(setStore(store)).to.eql(store)
  })
})
