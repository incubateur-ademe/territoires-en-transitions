import { expect } from 'chai'
import { storeKey } from '../../src/api/store'
import { getActionStatus, setActionStatus } from '../../src/api/actionStatus'

describe('getActionStatus', function () {
  describe('when action status is set in localStorage', function () {
    before(function () {
      const store = JSON.stringify({
        action_statuses: {
          '1.1.1.1': {
            action_id: '1.1.1.1',
            avancement: 'non_concernee',
          }
        }
      })

      localStorage.setItem(storeKey, store)
    })

    it('returns the stored status', function () {
      expect(getActionStatus('1.1.1.1')).to.eql({
        actionId: '1.1.1.1',
        avancement: 'non_concernee'
      })
    });
  })

  describe('when store is empty', function () {
    it('return null', function() {
      expect(getActionStatus('1.1.1.1')).to.be.null
    })
  })

  describe('when action status is empty', function () {
    before(function() {
      const store = JSON.stringify({
        action_statuses: {},
      })

      localStorage.setItem(storeKey, store)
    })

    it('return null', function() {
      expect(getActionStatus('1.1.1.1')).to.be.null
    })
    
  });

  afterEach(function () {
    localStorage.clear()
  })
})

describe('setActionStatus', function () {
  /**
   * Shared behaviour for different contexts
   */
  const shouldCreateOrUpdateAnStatus = function() {
    it('sets the passed status in localStorage under the key' +
      '  territoiresentransitions.fr', function () {
      const actionId = '1.1.1.1'
      const status = 'non_concernee'

      setActionStatus(actionId, status)

      const savedStore = localStorage.getItem(storeKey)!
      const savedStatus = JSON.parse(savedStore).action_statuses['1.1.1.1']

      expect(savedStatus).to.eql({
        action_id: '1.1.1.1',
        avancement: 'non_concernee',
      })
    })

    it('returns an object representing the action status', function () {
      const actionId = '1.1.1.1'
      const status = 'non_concernee'

      expect(setActionStatus(actionId, status)).to.eql({
        actionId: '1.1.1.1',
        avancement: 'non_concernee',
      })
    })
  }

  describe('when action statuses entry exist', function() {
    before(function () {
      const store = JSON.stringify({
        action_statuses: {
          '1.1.1.1': {
            action_id: '1.1.1.1',
            avancement: 'faite',
          }
        },
      })

      localStorage.setItem(storeKey, store)
    })

    shouldCreateOrUpdateAnStatus()
  })

  describe("when action statuses entry doesn't exist", function () {
    shouldCreateOrUpdateAnStatus()
  })

  afterEach(function() {
    localStorage.clear()
  })
})