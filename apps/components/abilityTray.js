export class AbilityTray {
  constructor(options = {}) {
    this.id = null;
    this.abilities = null;
    this.category = options.category || null;
    this.actorUuid = options.actorUuid || null;
  }
}
