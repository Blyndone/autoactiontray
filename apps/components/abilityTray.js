export class AbilityTray {
  constructor(options = {}) {
    this.id = null;
    this.abilities = [];
    this.category = options.category || null;
    this.actorUuid = options.actorUuid || null;
    this.active = false;
    this.type = "";
  }

  static padArray(arr, length = 20, filler = null) {
    if (arr == null) return new Array(length).fill(filler);
    return [...arr, ...Array(Math.max(0, length - arr.length)).fill(filler)];
  }
}
