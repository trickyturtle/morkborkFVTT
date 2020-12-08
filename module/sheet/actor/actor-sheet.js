import { MbClassList } from "../../config.js"; 

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class MorkBorgActorSheet extends ActorSheet {

  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["morkborg", "sheet", "actor"],
      width: 900,
      height: 620,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "main" }]
    });
  }

  /* -------------------------------------------- */

  /** @override */
  get template() {
    const path = "systems/morkborg/templates/actor";
    return `${path}/${this.actor.data.type}-sheet.html`;
  }
  
  /* -------------------------------------------- */

  /** @override */
  async getData() {
    const data = super.getData();
    const dataActor = data.actor;

    data.dtypes = ["String", "Number", "Boolean"];

    // Include CONFIG values
    data.config = CONFIG.MB;

    // Prepare items.
    if (this.actor.data.type == 'character') {
      dataActor.classNameList = await MbClassList.getClasses(true);
      dataActor.classObjectList = await MbClassList.getClasses(false);
      this._prepareCharacterItems(data);
    }
    else if (this.actor.data.type == 'npc') {
      this._prepareNpcItems(data);
    }

    return data;
  }

   /**
   * Organize and classify Items for NPC sheets.
   * TODO: this can probably be deleted, MB is simple enough that we can use the same sheet for Npcs and PCs
   *
   * @param {Object} actorData The actor to prepare.
   *
   * @return {undefined}
   */
  _prepareNpcItems(data) {
    const dataActor = data.actor;

    // Initialize containers.
    const features = [];
    const gears = [];
    const weapons = [];
    const armors = [];
    const scrolls = {
      "unclean": [],
      "sacred": [],
      "unknown": []
    }

    // Iterate through items, allocating to containers
    for (let i of data.items) {
      let item = i.data;
      i.img = i.img || DEFAULT_TOKEN;

      // Append to weapons.
      if (i.type === 'weapon') {
        weapons.push(i);
      }
      
      // Append to armors.
      else if (i.type === 'armor') {
        armors.push(i);
      }

      // Append to scrolls.
      else if (i.type === 'scroll') {
        // scrolls.push(i);
        switch (item.scrollType) {
          case 'unclean':
            scrolls[item.scrollType].push(i);
            break;
          case 'sacred':
            scrolls[item.scrollType].push(i);
            break;
          default:
            scrolls["unknown"].push(i);
            break;
        }
      }
      
      // Append to gear list.
      else if (i.type === 'gear') {
        gears.push(i);
      }
      // Append to features list.
      else if (i.type === 'feature') {
        features.push(i);
      }
    }

    dataActor.features = features;
    dataActor.gears = gears;
    dataActor.weapons = weapons;
    dataActor.armors = armors;
    dataActor.scrolls = scrolls;
  }

   /**
   * Organize and classify Items for Character sheets.
   *
   * @param {Object} actorData The actor to prepare.
   *
   * @return {undefined}
   */
  _prepareCharacterItems(data) {
    const dataActor = data.actor;
    const dataData = data.data;

    this._processClass(data)

    // Initialize containers.
    const features = []
    const gears = [];
    const weapons = [];
    const armors = [];
    const scrolls = {
      "unclean": [],
      "sacred": [],
      "unknown": []
    }

    let sacks = 0;
    let stones = 0;
    let soaps = 0;

    // Iterate through items, allocating to containers
    for (let i of data.items) {
      let item = i.data;
      i.img = i.img || DEFAULT_TOKEN;

      if(i.type !== "feature") {
        sacks += item.encumbrance.sacks
        stones += item.encumbrance.stones
        soaps += item.encumbrance.soaps
      }

      //Append to features
      if(i.type === 'feature'){
        features.push(i);
      }

      // Append to weapons.
      if (i.type === 'weapon') {
        weapons.push(i);
      }
      
      // Append to armors.
      else if (i.type === 'armor') {
        armors.push(i);
      }

      // Append to scrolls.
      else if (i.type === 'scroll') {
        // scrolls.push(i);
        switch (item.scrollType) {
          case 'unclean':
            scrolls[item.scrollType].push(i);
            break;
          case 'sacred':
            scrolls[item.scrollType].push(i);
            break;
          default:
            scrolls["unknown"].push(i);
            break;
        }
      }
      
      // Append to gear list.
      else if (i.type === 'gear') {
        gears.push(i);
      }
    }

    const totalSoaps = soaps % 100;
    stones += Math.floor(soaps / 100);
    const totalStones = stones % 10;
    const totalSacks = sacks + Math.floor(stones / 10);

    let invSlotsUsed = stones + (sacks * 10);

    if (totalSoaps > 1) {
      invSlotsUsed ++;
    }

    // Assign and return
    dataData.inventorySlots.value = invSlotsUsed;
    dataData.encumbrance.soaps = totalSoaps;
    dataData.encumbrance.stones = totalStones;
    dataData.encumbrance.sacks = totalSacks;
    dataActor.encumbered = invSlotsUsed > 10 ? true : false
    dataActor.overEncumbered = invSlotsUsed > 20 ? true : false
    dataActor.features = features;
    dataActor.gears = gears;
    dataActor.weapons = weapons;
    dataActor.armors = armors;
    dataActor.scrolls = scrolls;
  }

  _processClass(data) {
    const dataActor = data.actor;
    const dataData = data.data;
    
    const classObj = dataActor.classObjectList.find(classObject => classObject.name === dataData.class.name)
    dataActor.classObj = classObj ? classObj.data : {}
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Everything below here is only needed if the sheet is editable
    if (!this.options.editable) return;

    // Add Inventory Item
    html.find('.item-create').click(this._onItemCreate.bind(this));

    // Update Inventory Item
    html.find('.item-edit').click(ev => {
      const li = $(ev.currentTarget).parents(".item");
      const item = this.actor.getOwnedItem(li.data("itemId"));
      item.sheet.render(true);
    });

    // Delete Inventory Item
    html.find('.item-delete').click(ev => {
      const li = $(ev.currentTarget).parents(".item");
      this.actor.deleteOwnedItem(li.data("itemId"));
      li.slideUp(200, () => this.render(false));
    });

    // Rollable abilities.
    html.find('.rollable').click(this._onRoll.bind(this));

    // Item summaries
    html.find('.item .item-name h4').click(event => this._onItemSummary(event));

    // Item Rolling
    html.find('.item .action').click(event => this._onItemRoll(event));

    // Drag events for macros.
    if (this.actor.owner) {
      let handler = ev => this._onDragItemStart(ev);
      // Find all items on the character sheet.
      html.find('li.item').each((i, li) => {
        // Ignore for the header row.
        if (li.classList.contains("item-header")) return;
        // Add draggable attribute and dragstart listener.
        li.setAttribute("draggable", true);
        li.addEventListener("dragstart", handler, false);
      });
    }
  }
  /**
   * Create a macro when a rollable element is dragged
   * @param {Event} event
   * @override */
  _onDragStart (event) {
    let dragData = null

    // Handle the various draggable elements on the sheet
    const classes = event.target.classList
    if (classes.contains('ability')) {
      // Normal ability rolls and DCC d20 roll under luck rolls
      const abilityId = event.currentTarget.dataset.ability
      const rollUnder = (abilityId === 'lck')
      dragData = {
        type: 'Ability',
        actorId: this.actor.id,
        data: {
          abilityId: abilityId,
          rollUnder: rollUnder
        }
      }
    } else if (classes.contains('ability-modifiers')) {
      // Force d20 + Mod roll over (for non-standard luck rolls) by dragging the modifier
      const abilityId = event.currentTarget.parentElement.dataset.ability
      if (abilityId) {
        dragData = {
          type: 'Ability',
          actorId: this.actor.id,
          data: {
            abilityId: abilityId,
            rollUnder: false
          }
        }
      }
    } else if (classes.contains('init')) {
      dragData = {
        type: 'Initiative',
        actorId: this.actor.id,
        data: {}
      }
    } else if (classes.contains('save')) {
      dragData = {
        type: 'Save',
        actorId: this.actor.id,
        data: event.currentTarget.dataset.save
      }
    } else if (classes.contains('skill-check')) {
      const skillId = event.currentTarget.parentElement.dataset.skill
      dragData = {
        type: 'Skill',
        actorId: this.actor.id,
        data: {
          skillId: skillId,
          skillName: this.actor.data.data.skills[skillId].label
        }
      }
    } else if (classes.contains('luck-die')) {
      dragData = {
        type: 'Luck Die',
        actorId: this.actor.id,
        data: {}
      }
    } else if (classes.contains('spell-check')) {
      dragData = {
        type: 'Spell Check',
        actorId: this.actor.id,
        data: {
          ability: event.currentTarget.parentElement.dataset.ability
        }
      }
    } else if (classes.contains('spell-item')) {
      const spell = event.currentTarget.dataset.spell
      const spellItem = this.actor.items.find(i => i.name === spell)
      let img
      if (spellItem) {
        img = spellItem.data.img
      }
      dragData = {
        type: 'Spell Check',
        actorId: this.actor.id,
        data: {
          ability: event.currentTarget.dataset.ability,
          spell: spell,
          img: img
        }
      }
    } else if (classes.contains('attack-bonus')) {
      dragData = {
        type: 'Attack Bonus',
        actorId: this.actor.id,
        data: {}
      }
    } else if (classes.contains('action-dice')) {
      dragData = {
        type: 'Action Dice',
        actorId: this.actor.id,
        data: {
          die: this.actor.data.data.attributes.actionDice.value
        }
      }
    } else if (classes.contains('weapon-button') || classes.contains('backstab-button')) {
      const li = event.currentTarget.parentElement
      const weapon = this.actor.items.get(li.dataset.itemId)
      dragData = {
        type: 'Weapon',
        actorId: this.actor.id,
        data: {
          weapon: weapon,
          slot: li.dataset.itemSlot,
          backstab: classes.contains('backstab-button')
        }
      }
    } else if (classes.contains('disapproval-range')) {
      dragData = {
        type: 'Apply Disapproval',
        actorId: this.actor.id,
        data: {}
      }
    } else if (classes.contains('disapproval-table')) {
      dragData = {
        type: 'Roll Disapproval',
        actorId: this.actor.id,
        data: {}
      }
    }

    if (dragData) {
      if (this.actor.isToken) dragData.tokenId = this.actor.token.id
      event.dataTransfer.setData('text/plain', JSON.stringify(dragData))
    }
  }


  /* -------------------------------------------- */
  /**
   * Handle creating a new Owned Item for the actor using initial data defined in the HTML dataset
   * @param {Event} event   The originating click event
   * @private
   */
  _onItemCreate(event) {
    event.preventDefault();
    const header = event.currentTarget;
    // Get the type of item to create.
    const type = header.dataset.type;
    // Grab any data associated with this control.
    const data = duplicate(header.dataset);
    // Initialize a default name.
    const name = `New ${type.capitalize()}`;
    // Prepare the item object.
    const itemData = {
      name: name,
      type: type,
      data: data
    };
    // Remove the type from the dataset since it's in the itemData.type prop.
    delete itemData.data["type"];

    // Finally, create the item!
    return this.actor.createOwnedItem(itemData);
  }

  /**
   * Handle clickable rolls.
   * @param {Event} event   The originating click event
   * @private
   */
  _onRoll(event) {
    event.preventDefault();
    const element = event.currentTarget;
    const dataset = element.dataset;

    if (dataset.roll) {
      let roll = new Roll(dataset.roll, this.actor.data.data);
      let label = dataset.label ? `Rolling ${dataset.label}` : '';
      roll.roll().toMessage({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        flavor: label
      });
    }
  }

    /**
   * Handle expand/collapse of an item on the character sheet
   * @private
   */
  _onItemSummary(event) {
    event.preventDefault();
    let li = $(event.currentTarget).parents(".item");
    let item = this.actor.getOwnedItem(li.data("item-id"));
        // chatData = item.getChatData({secrets: this.actor.owner});

    // Toggle summary
    if ( li.hasClass("expanded") ) {
      let summary = li.children(".item-summary");
      summary.slideUp(200, () => summary.remove());
    } else {
      let div = $(`<div class="item-summary">${item.data.data.description}</div>`);
      let props = $(`<div class="item-properties"></div>`);

      if(item.data.type !== "feature"){
        props.append(`<span class="tag">Silver ${item.data.data.silver}</span>`);
      }

      // TODO clean this up on the items object
      let strEnc = "";
      if (item.data.data.encumbrance.sacks > 0) {
        strEnc += item.data.data.encumbrance.sacks
        if (item.data.data.encumbrance.sacks > 1) {
          strEnc += " Sacks"
        } else {
          strEnc += " Sack"
        }
        if (item.data.data.encumbrance.stones > 0 || item.data.data.encumbrance.soaps > 0) {
          strEnc += ", "
        }
      }
      if (item.data.data.encumbrance.stones > 0) {
        strEnc += item.data.data.encumbrance.stones
        if (item.data.data.encumbrance.stones > 1) {
          strEnc += " Stones"
        } else {
          strEnc += " Stone"
        }
        if (item.data.data.encumbrance.soaps > 0) {
          strEnc += ", "
        }
      }
      if (item.data.data.encumbrance.soaps > 0) {
        strEnc += item.data.data.encumbrance.soaps
        if (item.data.data.encumbrance.soaps > 1) {
          strEnc += " Soaps"
        } else {
          strEnc += " Soap"
        }
      }

      if(item.data.type !== "feature"){
        props.append(`<span class="tag">Encumbrance ${strEnc}</span>`);
      }

      if (item.data.data.isConsumable) {
        props.append(`<span class="tag">Usage Die ${item.data.data.usageDie} ${item.data.data.usageDieType}</span>`);
      }

      if (item.data.data.hasLight) {
        props.append(`<span class="tag">Light Source Radius ${item.data.data.lightRadius}, Strength ${item.data.data.lightStrength}</span>`);
      }

      div.append(props);
      li.append(div.hide());
      div.slideDown(200);
    }
    li.toggleClass("expanded");
  }

  /**
   * Handle rolling of an item from the Actor sheet, obtaining the Item instance and dispatching to it's roll method
   * @private
   */
  _onItemRoll(event) {
    event.preventDefault();
    const itemId = event.currentTarget.closest(".item").dataset.itemId;
    const item = this.actor.getOwnedItem(itemId);

    // Trigger the item roll
    if ( item.data.type === "scroll" ) {
      return ui.notifications.warn(`Scrolls cannot be rolled yet.`);
      // TODO return actor.useScroll(item);
    }
    if ( item.data.type === "gear" ) {
      return ui.notifications.warn(`Gear cannot be rolled yet.`);
      // TODO return actor.useGear(item);
    }

    // Otherwise roll the Item directly
    else return item.roll();
  }

}
