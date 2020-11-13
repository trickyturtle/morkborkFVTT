/**
 * Extend the basic Item with some very simple modifications.
 * @extends {Item}
 */
export class MorkBorgItem extends Item {
  /**
   * Augment the basic Item data model with additional dynamic data.
   */
  prepareData() {
    super.prepareData();

    // Get the Item's data
    const itemData = this.data;
    const actorData = this.actor ? this.actor.data : {};
    const data = itemData.data;
    const C = CONFIG.MB;

    if (itemData.type === "armor") {
      switch (Number(data.tier)) {
        case 0:
          data.damageReductionDice = "-1";
          data.agilityPenalty = null
          data.defencePenalty = null
          break;
        case 1:
          data.damageReductionDice = "-1d2";
          data.agilityPenalty = null
          data.defencePenalty = null
          break;
        case 2:
          data.damageReductionDice = "-1d4";
          data.agilityPenalty = 2
          data.defencePenalty = 2
          break;
        case 3:
          data.damageReductionDice = "-1d6";
          data.agilityPenalty = 4
          data.defencePenalty = 2
          break;
        default:
          data.damageReductionDice = "0";
          data.agilityPenalty = null
          data.defencePenalty = null
          break;
      }
    }
  }

/**
 * Handle clickable rolls.
 * @param {Event} event The originating click event
 * @private
 */
async roll() {
  // Basic template rendering data
  const token = this.actor.token;
  const item = this.data;
  const actorData = this.actor ? this.actor.data.data : {};
  const itemData = item.data;

  // Define the roll formula.
  let roll = null;
  let label = null;
  if (item.type === "armor") {
    roll = new Roll(itemData.damageReductionDice, actorData);
    label = `<b>${item.name} Damage Reduction</b>`;
  } else if (item.type === "weapon") {
    roll = new Roll(itemData.damageDice, actorData);
    label = `<b>${item.name} Damage</b>`;
  } else {
    // something went wrong
    return ui.notifications.warn(`Error: Item was not of type Armor or Weapon.`);
  }
  
  // Roll and send to chat.
  roll.roll().toMessage({
    speaker: ChatMessage.getSpeaker({ actor: this.actor }),
    flavor: label
  });
}

}
