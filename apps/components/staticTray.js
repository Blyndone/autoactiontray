import { AbilityTray } from './abilityTray.js';

export class StaticTray extends AbilityTray {
  constructor(options = {}) {
    super(options);
    this.category = options.category;
    this.classResource = options.classResource;
    this.spellLevel = options.spellLevel;
    this.itemUsesUUID = options.itemUsesUUID || null;
    this.generateTray();
  }

  generateTray() {
    let actor = fromUuidSync(this.actorUuid);

    let allItems = actor.items.filter((e) => e.system?.activities?.size);
    switch (this.category) {
      case 'action':
        this.abilities = allItems.filter((e) =>
          e.system?.activities?.some(
            (activity) => activity?.activation?.type === 'action'
          )
        );
        this.id = 'action';
        break;

      case 'bonus':
        this.abilities = allItems.filter((e) =>
          e.system?.activities?.some(
            (activity) => activity?.activation?.type === 'bonus'
          )
        );
        this.id = 'bonus';
        break;

      case 'class':
        if (this.itemUsesUUID) {
          this.abilities = allItems.filter((e) =>
            e.system.activities?.some((activity) =>
              activity.consumption?.targets?.some(
                (target) => target.target === itemUsesUUID
              )
            )
          );
        }
        this.id = 'class';
        break;

      case 'spell':
        this.abilities = allItems.filter(
          (e) =>
            e.system.level === this.spellLevel &&
            e.system.preparation?.prepared == true
        );
        this.id = 'spell-' + this.spellLevel;
        break;

      case 'ritual':
        this.abilities = allItems.filter(
          (e) => e.type === 'spell' && e.system.properties.has('ritual')
        );
        this.id = 'ritual';
        break;
    }
  }
}
