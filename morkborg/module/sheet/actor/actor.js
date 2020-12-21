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
    ability.mod = ability.value || 0
    ability.label = CONFIG.MB.abilities[abilityId]

    let roll
    const die = "1d20"
    roll = new Roll('@die+@abilMod', { die, abilMod: ability.mod, critical: 20 })
    

    // Convert the roll to a chat message
    roll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor: this }),
      flavor: `${ability.label} ${'MB.Check'}`
    })
  }

  /**
   * Roll a Weapon Attack
   * @param {string} weaponId     The weapon name or slot id (e.g. "m1", "r1")
   * @param {Object} options      Options which configure how ability tests are rolled
   */
  async rollWeaponAttack (weaponId, options = {}) {
    // Display standard cards in chat?
    let displayStandardCards = false
    try {
      displayStandardCards = game.settings.get('mb', 'useStandardDiceRoller')
    } catch (err) { }

    // First try and find the item by name or id
    let weapon = this.items.find(i => i.name === weaponId || i._id === weaponId)

    // If all lookups fail, give up and show a warning
    if (!weapon) {
      return ui.notifications.warn(game.i18n.localize('MB.WeaponNotFound'), { id: weaponId })
    }
    let abilityId = "strength"
    if(weapon.data.data.rangeType === "Ranged"){
      abilityId = "presence"
    }
    const ability = this.data.data.abilities[abilityId]
    const modifier = ability.value

    let roll
    /* Determine crit range */
    const critRange = weapon.data.data.critRange || 20
    roll = new Roll('1d20+@abilMod', {abilMod: modifier, critical: critRange})
    
    const speaker = { alias: this.name, _id: this._id }

    roll.roll()
    const d20RollResult = roll.dice[0].total

    if (displayStandardCards) {
      roll.toMessage({
        speaker: ChatMessage.getSpeaker({ actor: this }),
        flavor: game.i18n.localize('MB.AttackRoll')
      })
    }

    /* Handle Critical Hits and fumbles TODO: make this more programmatic*/
    //const crit = (d20RollResult > 1 && (d20RollResult >= critRange)) ? await this.rollCritical() : ''
    //const fumble = (d20RollResult === 1) ? await this.rollFumble() : ''
    const crit = (d20RollResult > 1 && (d20RollResult >= critRange))
    const fumble = (d20RollResult === 1)
    if(!fumble){
      /* Roll the Damage */
      const damageRoll = new Roll(weapon.data.data.damageDice)
      damageRoll.roll()

      if (displayStandardCards) {
        damageRoll.toMessage({
          speaker: ChatMessage.getSpeaker({ actor: this }),
          flavor: game.i18n.localize('MB.DamageRoll')
        })
      }

      /* Emote attack results */
      if (!displayStandardCards) {
        const attackRollHTML = this._formatRoll(roll, Roll.cleanFormula(roll.terms || roll.formula))
        const damageRollData = escape(JSON.stringify(damageRoll))
        const damageRollTotal = crit ? damageRoll.total * 2 : damageRoll.total
        const damageRollHTML = `<a class="inline-roll inline-result damage-applyable" data-roll="${damageRollData}" data-damage="${damageRollTotal}" title="${Roll.cleanFormula(damageRoll.terms || damageRoll.formula)}"><i class="fas fa-dice-d20"></i> ${damageRollTotal}</a>`

        let emote = crit ? 'MB.AttackCritEmote': 'MB.AttackRollEmote'
        if(fumble){
          emote = 'MB.AttackFumbleEmote'
        }
        const messageData = {
          user: game.user._id,
          speaker: speaker,
          type: CONST.CHAT_MESSAGE_TYPES.EMOTE,
          content: game.i18n.format(emote, {
            weaponName: weapon.name,
            rollHTML: attackRollHTML,
            damageRollHTML: damageRollHTML,
            crit: crit,
            fumble: fumble
          }),
          sound: CONFIG.sounds.dice
        }
        await CONFIG.ChatMessage.entityClass.create(messageData)
      }
    }
  }

  /**
   * Roll a Critical Hit
   */
  async rollCritical () {
    // Display standard cards in chat?
    const displayStandardCards = game.settings.get('mb', 'useStandardDiceRoller')

    // Roll the crit
    const roll = new Roll(`${this.data.data.attributes.critical.die} + ${this.data.data.abilities.lck.mod}`)
    roll.roll()
    const rollData = escape(JSON.stringify(roll))
    const rollTotal = roll.total
    const rollHTML = `<a class="inline-roll inline-result" data-roll="${rollData}" data-damage="${rollTotal}" title="${Roll.cleanFormula(roll.terms || roll.formula)}"><i class="fas fa-dice-d20"></i> ${rollTotal}</a>`

    // Lookup the crit table if available
    let critResult = null
    const critsPackName = game.settings.get('mb', 'critsCompendium')
    if (critsPackName) {
      const pack = game.packs.get(critsPackName)
      if (pack) {
        await pack.getIndex() // Load the compendium index
        const critTableFilter = `Crit Table ${this.data.data.attributes.critical.table}`
        const entry = pack.index.find((entity) => entity.name.startsWith(critTableFilter))
        if (entry) {
          const table = await pack.getEntity(entry._id)
          critResult = await table.draw({ roll, displayChat: displayStandardCards })
        }
      }
    }

    if (!displayStandardCards) {
      // Display crit result or just a notification of the crit
      if (critResult) {
        return ` <br/><br/><span style='color:#ff0000; font-weight: bolder'>${game.i18n.localize('MB.CriticalHit')}!</span> ${rollHTML}<br/>${critResult.results[0].text}`
      } else {
        return ` <br/><br/><span style='color:#ff0000; font-weight: bolder'>${game.i18n.localize('MB.CriticalHit')}!</span> ${rollHTML}`
      }
    }
  }

  /**
   * Roll a Fumble
   */
  async rollFumble () {
    // Display standard cards in chat?
    const displayStandardCards = game.settings.get('mb', 'useStandardDiceRoller')

    let fumbleDie
    try {
      fumbleDie = this.data.data.attributes.fumble.die
    } catch (err) {
      fumbleDie = '1d4'
    }

    // Roll the fumble
    const roll = new Roll(`${fumbleDie} - ${this.data.data.abilities.lck.mod}`)
    roll.roll()
    const rollData = escape(JSON.stringify(roll))
    const rollTotal = roll.total
    const rollHTML = `<a class="inline-roll inline-result" data-roll="${rollData}" data-damage="${rollTotal}" title="${Roll.cleanFormula(roll.terms || roll.formula)}"><i class="fas fa-dice-d20"></i> ${rollTotal}</a>`

    // Lookup the fumble table if available
    let fumbleResult = null
    const fumbleTableName = game.settings.get('mb', 'fumbleTable')
    if (fumbleTableName) {
      const fumbleTablePath = fumbleTableName.split('.')
      let pack
      if (fumbleTablePath.length === 3) {
        pack = game.packs.get(fumbleTablePath[0] + '.' + fumbleTablePath[1])
      }
      if (pack) {
        await pack.getIndex() // Load the compendium index
        const entry = pack.index.find((entity) => entity.name === fumbleTablePath[2])
        if (entry) {
          const table = await pack.getEntity(entry._id)
          fumbleResult = await table.draw({ roll, displayChat: displayStandardCards })
        }
      }
    }

    if (!displayStandardCards) {
      // Display fumble result or just a notification of the fumble
      if (fumbleResult) {
        return ` <br/><br/><span style='color:red; font-weight: bolder'>Fumble!</span> ${rollHTML}<br/>${fumbleResult.results[0].text}`
      } else {
        return ` <br/><br/><span style='color:red; font-weight: bolder'>Fumble!</span> ${rollHTML}`
      }
    }
  }

  /**
   * Format a roll for display in-line
   * @param {Object<Roll>} roll   The roll to format
   * @param {string} formula      Formula to show when hovering
   * @return {string}             Formatted HTML containing roll
   */
  _formatRoll (roll, formula) {
    const rollData = escape(JSON.stringify(roll))

    // Check for Crit/Fumble
    let critFailClass = ''
    if (Number(roll.dice[0].results[0]) === 20) { critFailClass = 'critical ' } else if (Number(roll.dice[0].results[0]) === 1) { critFailClass = 'fumble ' }
    return `<a class="${critFailClass}inline-roll inline-result" data-roll="${rollData}" title="${formula}"><i class="fas fa-dice-d20"></i> ${roll.total}</a>`
  }

  /**
   * Apply damage to this actor
   * @param {Number} damageAmount   Damage amount to apply
   * @param {Number} multiplier     Damage multiplier
   */
  async applyDamage (damageAmount, multiplier) {
    const speaker = { alias: this.name, _id: this._id }

    // Calculate damage amount and current hit points
    const amount = damageAmount * multiplier
    const hp = this.data.data.attributes.hp.value

    let newHp = hp
    if (amount > 0) {
      // Taking damage - just subtract and allow damage to go below zero
      newHp = newHp - amount
    } else {
      // Healing - don't allow HP to be brought above MaxHP, but if it's already there assume it's intentional
      const maxHp = this.data.data.attributes.hp.max
      if (hp >= maxHp) {
        newHp = hp
      } else {
        newHp = Math.min(newHp - amount, maxHp)
      }
    }

    const deltaHp = newHp - hp

    // Announce damage or healing results
    if (Math.abs(deltaHp) > 0) {
      const locstring = (deltaHp > 0) ? 'MB.HealDamage' : 'MB.TakeDamage'
      const messageData = {
        user: game.user._id,
        speaker: speaker,
        type: CONST.CHAT_MESSAGE_TYPES.EMOTE,
        content: game.i18n.format(locstring, { target: this.name, damage: Math.abs(deltaHp) }),
        sound: CONFIG.sounds.notification
      }
      await CONFIG.ChatMessage.entityClass.create(messageData)
    }

    // Apply new HP
    return this.update({
      'data.attributes.hp.value': newHp
    })
  }

}