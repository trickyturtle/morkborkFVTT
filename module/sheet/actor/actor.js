import { MbClassList } from "../../config.js"; 

/**
 * Extend the base Actor entity by defining a custom roll data structure which is ideal for the Simple system.
 * @extends {Actor}
 */
export class MorkBorgActor extends Actor {

  /**
   * Augment the basic actor data with additional dynamic data.
   */
  prepareData() {
    super.prepareData();

    const actorData = this.data;
    const data = actorData.data;
    const flags = actorData.flags;

    if (actorData.type === 'character') {
      this._prepareCharacterData(actorData);
    }
  }

  /**
   * Prepare Character type specific data
   */
  _prepareCharacterData(actorData) {
    const data = actorData.data;
  }

  /**
   * Roll an Ability Check
   * @param {String} abilityId    The ability ID (e.g. "str")
   * @param {Object} options      Options which configure how ability checks are rolled
   */
  rollAbilityCheck (abilityId) {
    const ability = this.data.data.abilities[abilityId]
    ability.mod = CONFIG.MB.abilities.modifiers[ability.value] || 0
    ability.label = CONFIG.MB.abilities[abilityId]

    let roll
    const die = this.data.data.attributes.actionDice.value
    roll = new Roll('@die+@abilMod', { die, abilMod: ability.mod, critical: 20 })
    

    // Convert the roll to a chat message
    roll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor: this }),
      flavor: `${ability.label} ${'MB.Check'}`
    })
  }
}