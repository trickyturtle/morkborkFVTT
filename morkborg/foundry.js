/* eslint-env jest */
import MB from '../config.js'

// console.log('Loading Foundry Mocks')

/**
 * Item
 */
const Item = jest.fn().mockImplementation(() => {
}).mockName('Item')
global.Item = Item

/**
 * Collection
 */
global.collectionFindMock = jest.fn().mockName('Collection.find')
const Collection = jest.fn().mockImplementation(() => {
  return {
    find: global.collectionFindMock
  }
}).mockName('Collection')
global.Collection = Collection

/**
 * Actor
 */
global.itemTypesMock = jest.fn().mockName('Actor.itemTypes getter')
class Actor {
  constructor (data, options) {
    // If test-specific data is passed in use it, otherwise use default data
    if (data) {
      this.data = data
    } 
    this.items = new Collection()
    this.prepareData()
    Object.defineProperty(this, 'itemTypes', {
      get: global.itemTypesMock
    })
  }

  prepareData () {
    // console.log('Mock Actor: super prepareData was called')
  }
}

global.actor = new Actor()
global.Actor = Actor

/**
 * ChatMessage
 */
class ChatMessage {
  constructor (data, options) {
    // If test-specific data is passed in use it, otherwise use default data
    if (data) {
      this.data = data
    }
  }

  static getSpeaker ({ scene, actor, token, alias } = {}) {
    return actor
  }
}

global.ChatMessage = ChatMessage

/**
 * CONFIG
 */
global.CONFIG = { MB: MB }
global.CONFIG.sounds = { dice: 'diceSound' }
global.CONST = { CHAT_MESSAGE_TYPES: { EMOTE: 'emote' } }

/**
 * Localization
 */
class Localization {
  localize (stringId) {
    // Just strip the MB off the string ID to simulate the lookup
    return stringId.replace('MB.', '')
  }

  format (stringId, data = {}) {
    let returnString = stringId.replace('MB.', '')
    for (const datum in data) {
      returnString += `,${datum}:${data[datum]}`
    }
    returnString += data.toString()
    return returnString
  }
}

global.Localization = Localization

/**
 * Game
 */
class Game {
  constructor (worldData, sessionId, socket) {
    this.i18n = new Localization()
  }
}

global.Game = Game
global.game = new Game()
global.game.user = { _id: 1 }

/**
 * Roll
 */
global.rollToMessageMock = jest.fn((messageData = {}, { rollMode = null, create = true } = {}) => {
  // console.log('Mock Roll: toMessage was called with:')
  // console.log(data)
})
global.rollRollMock = jest.fn(() => {
  // console.log('Mock Roll: roll was called')
  return { total: 1 }
})
global.rollCleanFormulaMock = jest.fn((terms) => {
  return terms
})
global.Roll = jest.fn((formula, data = {}) => {
  return {
    dice: [{ results: [10], options: {} }],
    toMessage: global.rollToMessageMock,
    roll: global.rollRollMock
  }
}).mockName('Roll')
global.Roll.cleanFormula = global.rollCleanFormulaMock

/**
 * ChatMessage
 */
global.CONFIG.ChatMessage = {
  entityClass: {
    create: jest.fn((messageData = {}) => {
      // console.log(messageData)
    })
  }
}

/**
 * Notifications
 */
global.uiNotificationsWarnMock = jest.fn((message, options) => {}).mockName('ui.notifications.warn')
global.uiNotificationsErrorMock = jest.fn((message, type, permenant) => {}).mockName('ui.notifications.error')
const Notifications = jest.fn().mockImplementation(() => {
  return {
    warn: global.uiNotificationsWarnMock,
    error: global.uiNotificationsErrorMock
  }
}).mockName('Notifications')
global.ui = {
  notifications: new Notifications()
}

/**
 * Global helper functions function
 */

// Foundry's implementation of getType
global.getType = function (token) {
  const tof = typeof token
  if (tof === 'object') {
    if (token === null) return 'null'
    const cn = token.constructor.name
    if (['String', 'Number', 'Boolean', 'Array', 'Set'].includes(cn)) return cn
    else if (/^HTML/.test(cn)) return 'HTMLElement'
    else return 'Object'
  }
  return tof
}

// Foundry's implementation of setProperty
global.setProperty = function (object, key, value) {
  let target = object
  let changed = false

  // Convert the key to an object reference if it contains dot notation
  if (key.indexOf('.') !== -1) {
    const parts = key.split('.')
    key = parts.pop()
    target = parts.reduce((o, i) => {
      if (!Object.prototype.hasOwnProperty.call(o, i)) o[i] = {}
      return o[i]
    }, object)
  }

  // Update the target
  if (target[key] !== value) {
    changed = true
    target[key] = value
  }

  // Return changed status
  return changed
}

// Foundry's implementation of expandObject
global.expandObject = function (obj, _d = 0) {
  const expanded = {}
  if (_d > 10) throw new Error('Maximum depth exceeded')
  for (let [k, v] of Object.entries(obj)) {
    if (v instanceof Object && !Array.isArray(v)) v = global.expandObject(v, _d + 1)
    global.setProperty(expanded, k, v)
  }
  return expanded
}

// Foundry's implementation of duplicate
global.duplicate = function (original) {
  return JSON.parse(JSON.stringify(original))
}

// Foundry's implementation of mergeObject
global.mergeObject = function (original, other = {}, { insertKeys = true, insertValues = true, overwrite = true, recursive = true, inplace = true, enforceTypes = false } = {}, _d = 0) {
  other = other || {}
  if (!(original instanceof Object) || !(other instanceof Object)) {
    throw new Error('One of original or other are not Objects!')
  }
  const depth = _d + 1

  // Maybe copy the original data at depth 0
  if (!inplace && (_d === 0)) original = global.duplicate(original)

  // Enforce object expansion at depth 0
  if ((_d === 0) && Object.keys(original).some(k => /\./.test(k))) original = global.expandObject(original)
  if ((_d === 0) && Object.keys(other).some(k => /\./.test(k))) other = global.expandObject(other)

  // Iterate over the other object
  for (let [k, v] of Object.entries(other)) {
    const tv = global.getType(v)

    // Prepare to delete
    let toDelete = false
    if (k.startsWith('-=')) {
      k = k.slice(2)
      toDelete = (v === null)
    }

    // Get the existing object
    let x = original[k]
    let has = Object.prototype.hasOwnProperty.call(original, k)
    let tx = global.getType(x)

    // Ensure that inner objects exist
    if (!has && (tv === 'Object')) {
      x = original[k] = {}
      has = true
      tx = 'Object'
    }

    // Case 1 - Key exists
    if (has) {
      // 1.1 - Recursively merge an inner object
      if ((tv === 'Object') && (tx === 'Object') && recursive) {
        global.mergeObject(x, v, {
          insertKeys: insertKeys,
          insertValues: insertValues,
          overwrite: overwrite,
          inplace: true,
          enforceTypes: enforceTypes
        }, depth)

      // 1.2 - Remove an existing key
      } else if (toDelete) {
        delete original[k]

      // 1.3 - Overwrite existing value
      } else if (overwrite) {
        if (tx && (tv !== tx) && enforceTypes) {
          throw new Error('Mismatched data types encountered during object merge.')
        }
        original[k] = v

      // 1.4 - Insert new value
      } else if ((x === undefined) && insertValues) {
        original[k] = v
      }

    // Case 2 - Key does not exist
    } else if (!toDelete) {
      const canInsert = (depth === 1 && insertKeys) || (depth > 1 && insertValues)
      if (canInsert) original[k] = v
    }
  }

  // Return the object for use
  return original
}

/**
 * Handlebars
 */
global.loadTemplates = jest.fn((templateList) => {}).mockName('loadTemplates')
