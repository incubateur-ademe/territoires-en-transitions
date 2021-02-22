import { expect } from 'chai'
import { getIndicator, setIndicator } from '../../src/api/indicator'
import { storeKey } from '../../src/api/store'

describe('getIndicator', function () {
  describe('when indicator is set in localStorage', function() {
    before(function() {
      const store = JSON.stringify({
          indicators: {
            '1a': {
              indicator_id: '1a',
              value: '42',
            }
          },
      })
      localStorage.setItem(storeKey, store)
    })

    it('returns the stored value', function() {
      const indicator = getIndicator('1a')

      expect(indicator!.indicator_id).to.eql('1a')
      expect(indicator!.value).to.eql('42')
    })
  })
  describe('when store is empty', function() {
    it('returns true', function () {
      const indicator = getIndicator('1')

      expect(indicator).to.be.null
    })
  })

  describe('when indicators entry is emtpy', function() {
    before(function() {
      const store = JSON.stringify({
        índicators: {},
      })
      localStorage.setItem(storeKey, store)
    })

    it('returns null', function() {
      const indicator = getIndicator('1')

      expect(indicator).to.be.null
    })
  })

  afterEach(function() {
    localStorage.clear()
  })
})

describe('setIndicator', function() {
  describe('when indicators entry exists', function() {
    before(function() {
      const store = {
        indicators: {}
      }

      localStorage.setItem(storeKey, JSON.stringify(store))
    })

    it('sets the passed indicator in localStorage under the key territoiresentransitions', function() {
        const indicatorId = '2b'
        const value = '666'

      setIndicator(indicatorId, value)

      const savedStore = localStorage.getItem(storeKey)!
      const savedIndicator = JSON.parse(savedStore).indicators['2b']

      expect(savedIndicator).to.eql({
        indicator_id: '2b',
        value: '666',
      })
    })

    it('returns the passed indicator', function() {
      const indicatorId = '2b'
      const value = '666'

      expect(setIndicator(indicatorId, value)).to.eql({
        indicator_id: '2b',
        value: '666',
      })
    })
  })

  describe("when indicators entry doesn't exist", function() {
    it('sets the passed indicator in localStorage under the key territoiresentransitions', function() {
      const indicatorId = '2b'
      const value = '666'

      setIndicator(indicatorId, value)

      const savedStore = localStorage.getItem(storeKey)!
      const savedIndicator = JSON.parse(savedStore).indicators['2b']

      expect(savedIndicator).to.eql({
        indicator_id: '2b',
        value: '666',
      })
    })

    it('returns the passed indicator', function() {
        const indicatorId = '2b'
        const value = '666'

      expect(setIndicator(indicatorId, value)).to.eql({
        indicator_id: '2b',
        value: '666',
      })
    })

  })

  afterEach(function() {
    localStorage.clear()
  })
})