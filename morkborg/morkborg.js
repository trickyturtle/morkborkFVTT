// Import Modules
import { MB } from "./module/config.js";
import { MorkBorgActor } from "./module/sheet/actor/actor.js";
import { MorkBorgActorSheet } from "./module/sheet/actor/actor-sheet.js";
import { MorkBorgItem } from "./module/sheet/item/item.js";
import { MorkBorgItemSheet } from "./module/sheet/item/item-sheet.js";
import { preloadHandlebarsTemplates } from "./module/templates.js";
import * as chat from './chat.js'


Hooks.once('init', async function() {

  CONFIG.MB = MB;

  game.morkborg = {
    MorkBorgActor,
    MorkBorgItem,
    rollItemMacro,
    getMacroActor,
    rollMBWeaponAttackMacro
  };

  /**
   * Set an initiative formula for the system
   * @type {String}
   */
  CONFIG.Combat.initiative = {
    formula: "1d6",
    decimals: 2
  };

  // Define custom Entity classes
  CONFIG.Actor.entityClass = MorkBorgActor;
  CONFIG.Item.entityClass = MorkBorgItem;

  // Register sheet application classes
  Actors.unregisterSheet("core", ActorSheet);
  Actors.registerSheet("morkborg", MorkBorgActorSheet, { makeDefault: true });
  Items.unregisterSheet("core", ItemSheet);
  Items.registerSheet("morkborg", MorkBorgItemSheet, { makeDefault: true });

  // If you need to add Handlebars helpers, here are a few useful examples:
  Handlebars.registerHelper('concat', function() {
    var outStr = '';
    for (var arg in arguments) {
      if (typeof arguments[arg] != 'object') {
        outStr += arguments[arg];
      }
    }
    return outStr;
  });

  Handlebars.registerHelper('toLowerCase', function(str) {
    return str.toLowerCase();
  });

  // Preload Handlebars Templates
  preloadHandlebarsTemplates();
});



/* -------------------------------------------- */
/*  Post initialization hook                    */
/* -------------------------------------------- */
Hooks.once('ready', async function () {
  // Register system settings - needs to happen after packs are initialised
  //await registerSystemSettings()
  // Wait to register hotbar drop hook on ready so that modules could register earlier if they want to
});
// Create a macro when a rollable is dropped on the hotbar
Hooks.on("hotbarDrop", (bar, data, slot) => createMorkBorgMacro(data, slot));

/* -------------------------------------------- */
/*  Other Hooks                                 */
/* -------------------------------------------- */
// Highlight 1's and 20's for all regular rolls
Hooks.on('renderChatMessage', (app, html, data) => {
  chat.highlightCriticalSuccessFailure(app, html, data)
})


/* -------------------------------------------- */
/*  Hotbar Macros                               */
/* -------------------------------------------- */

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {Object} data     The dropped data
 * @param {number} slot     The hotbar slot to use
 * @returns {Promise}
 */
async function createMorkBorgMacro(data, slot) {
  const handlers = {
    Ability: _createMBAbilityMacro,
    Armor: _createMBDefenseMacro,
    Weapon: _createMBWeaponAttackMacro
  }
  if (!handlers[data.type]) return
  if (!("data" in data)) return ui.notifications.warn("You can only create macro buttons for owned Items");
  const item = data.data;

  // Call the appropriate function to generate a macro
  const macroData = handlers[data.type](data, slot)
  if (macroData) {
    // Create or reuse existing macro
    let macro = game.macros.entities.find(
      m => (m.name === macroData.name) && (m.command === macroData.command)
    )
    if (!macro) {
      macro = await Macro.create({
        name: macroData.name,
        type: 'script',
        img: macroData.img,
        command: macroData.command,
        flags: { 'morkborg.itemMacro': true }
      })
    }
    await game.user.assignHotbarMacro(macro, slot)
  }
  return false
}

/**
 * Create a macro from an ability check drop.
 * @param {Object} data     The dropped data
 * @param {number} slot     The hotbar slot to use
 * @returns {Promise}
 */
function _createMBAbilityMacro (data, slot) {
  if (data.type !== 'Ability') return

  // Create the macro command
  const abilityId = data.data.abilityId
  const macroData = {
    name: game.i18n.localize(CONFIG.MB.abilities[abilityId]),
    command: `const _actor = game.morkborg.getMacroActor(); if (_actor) { _actor.rollAbilityCheck("${abilityId}") }`,
    img: 'icons/dice/d20black.svg'
  }
  return macroData
}

/**
 * Create a macro from a spell check drop.
 * @param {Object} data     The dropped data
 * @param {number} slot     The hotbar slot to use
 * @returns {Promise}
 */
function _createMBPowerCheckMacro (data, slot) {
  if (data.type !== 'Spell Check') return

  // Create the macro command
  const spell = data.data.spell || null
  const img = data.data.img || null
  const macroData = {
    name: spell || game.i18n.localize('MB.SpellCheck'),
    command: 'const _actor = game.morkborg.getMacroActor(); if (_actor) { _actor.rollSpellCheck() }',
    img: img || '/systems/mb/styles/images/critical.png'
  }

  if (spell) {
    macroData.command = `const _actor = game.morkborg.getMacroActor(); if (_actor) { _actor.rollSpellCheck({ spell: "${spell}" }) }`
  }

  return macroData
}

/**
 * Create a Macro from a weapon drop.
 * Get an existing macro if one exists, otherwise create a new one.
 * @param {Object} data     The dropped data
 * @param {number} slot     The hotbar slot to use
 * @returns {Promise}
 */
function _createMBWeaponAttackMacro (data, slot) {
  if (data.type !== 'Weapon') return
  const item = data.data.weapon
  const weaponId = data.data.weapon._id

  const macroData = {
    name: item.name,
    command: `game.morkborg.rollMBWeaponAttackMacro("${weaponId}");`,
    img: item.img
  }
  return macroData
}
/**
 * Create a Macro from a weapon drop.
 * Get an existing macro if one exists, otherwise create a new one.
 * @param {Object} data     The dropped data
 * @param {number} slot     The hotbar slot to use
 * @returns {Promise}
 */
function _createMBDefenseMacro (data, slot) {
  if (data.type !== 'Weapon') return
  const item = data.data.weapon
  const weaponSlot = data.data.slot

  const macroData = {
    name: item.name,
    command: `game.morkborg.rollMBWeaponAttackMacro("${weaponSlot}", ${JSON.stringify(options)});`,
    img: '/systems/mb/styles/images/axe-square.png'
  }
  return macroData
}

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {string} itemName
 * @return {Promise}
 */
function rollItemMacro(itemName) {
  const speaker = ChatMessage.getSpeaker();
  let actor;
  if (speaker.token) actor = game.actors.tokens[speaker.token];
  if (!actor) actor = game.actors.get(speaker.actor);

  // Get matching items
  const items = actor ? actor.items.filter(i => i.name === itemName) : [];
  if ( items.length > 1 ) {
    ui.notifications.warn(`Your controlled Actor ${actor.name} has more than one Item with name ${itemName}. The first matched item will be chosen.`);
  } else if ( items.length === 0 ) {
    return ui.notifications.warn(`Your controlled Actor does not have an item named ${itemName}`);
  }
  const item = items[0];

    // Trigger the item roll
    if ( item.data.type === "scroll" ) {
      return ui.notifications.warn(`Scrolls cannot be in the hotbar yet.`);
      // TODO return actor.useScroll(item);
    }
    if ( item.data.type === "gear" ) {
      return ui.notifications.warn(`Gear cannot be in the hotbar yet.`);
      // TODO return actor.useGear(item);
    }
    return item.roll();
}
/**
 * Get the current actor - for use in macros
 * @return {Promise}
 */
function getMacroActor () {
  const speaker = ChatMessage.getSpeaker()
  let actor
  if (speaker.token) actor = game.actors.tokens[speaker.token]
  if (!actor) actor = game.actors.get(speaker.actor)
  if (!actor) return ui.notifications.warn('You must select a token to run this macro.')

  // Return the actor if found
  return actor
}

/**
 * Roll a weapon attack from a macro.
 * @param {string} itemId
 * @return {Promise}
 */
function rollMBWeaponAttackMacro (itemId, options = {}) {
  const speaker = ChatMessage.getSpeaker()
  let actor
  if (speaker.token) actor = game.actors.tokens[speaker.token]
  if (!actor) actor = game.actors.get(speaker.actor)
  if (!actor) return ui.notifications.warn('You must select a token to run this macro.')

  // Trigger the weapon roll
  return actor.rollWeaponAttack(itemId, options)
}
