import { AbilityTray } from './abilityTray.js';

export class CustomTray extends AbilityTray {
  constructor(options = {}) {
    super(options);
    this.savedDate = false;
    this.category = options.category;
    this.id = options.id;
    this.type = 'custom';

    if (!this.savedData && !this.checkSavedData(this.id)) {
      console.log('Generating Custom Trays');
      this.generateTray();
    } else {
      console.log('Getting Saved Data');
      this.getSavedData();
    }
  }

  generateTray() {
    // Common, Class, Consumables
    let tmpActor;
    let actor = fromUuidSync(this.actorUuid);
    tmpActor = actor;
    let allItems = tmpActor.items.filter((e) => e.system?.activities?.size);

    switch (this.category) {
      case 'common':
        this.abilities = allItems.filter(
          (e) =>
            e.system?.activities?.some(
              (activity) => activity?.activation?.type === 'action'
            ) ||
            e.system?.activities?.some(
              (activity) => activity?.activation?.type === 'bonus'
            )
        );
        this.id = 'common';
        break;
      case 'class':
        this.abilities = allItems.filter((e) => e.type === 'feat');
        this.id = 'class';
        break;
      case 'items':
       
        this.abilities = allItems.filter((e) => e.type === 'consumable');
        this.id = 'items';
        break;
      case 'custom':
        this.id = 'custom';
        break;
    }

    this.abilities = AbilityTray.padArray(this.abilities, 20);
  }

    static generateCustomTrays(actor) {
      let commonTray = new CustomTray({
        category: 'common',
        id: 'common',
        actorUuid: actor.uuid,
      });
      let classTray = new CustomTray({
        category: 'class',
        id: 'class',
        actorUuid: actor.uuid,
      });
      let consumablesTray = new CustomTray({
        category: 'items',
        id: 'items',
        actorUuid: actor.uuid,
      });
  
      let customTray = new CustomTray({
        category: 'custom',
        id: 'custom',
        actorUuid: actor.uuid,
      });
      return [commonTray, classTray, consumablesTray, customTray];
    }

  checkSavedData() {
    let actor = fromUuidSync(this.actorUuid);
    if (actor != null) {
     
      return actor.getFlag('auto-action-tray', 'data.'+this.id) != null;
    }
  }

  getSavedData() {
    let actor = fromUuidSync(this.actorUuid);

    let data = actor.getFlag('auto-action-tray', 'data');
    if (data[this.id]?.abilities != null) {
      this.abilities = JSON.parse(data[this.id].abilities).map((e) =>
        e ? actor.items.get(e) : null
      );
    }
    this.savedData = true;
  }

  setSavedData() {
    
    let actor = fromUuidSync(this.actorUuid);
    if (actor != null) {
      let temparr = this.abilities.map((e) => (e ? e.id : null));
      actor.setFlag('auto-action-tray', 'data', {
        [this.id]: { abilities: JSON.stringify(temparr) },
      });
    }
  }

  setAbility(index, ability) {
    this.abilities[index] = ability;
    this.setSavedData();
  }
 
  getAbilities() {
    return this.abilities;
  }
  
}
// fromUuid(this.actorUuid).then((actor) => {
//     tmpActor = actor
