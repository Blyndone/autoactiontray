export class SkillTray {
  constructor(options = {}) {
    this.id = "skill";
    this.actor;
    this.actorUuid = options.actorUuid;
    this.characterClass = null;
    this.inCombat = true;
    this.currentSkills = [];
    this.skillAbbr = {
      acrobatics: "acr",
      animalHandling: "ani",
      arcana: "arc",
      athletics: "ath",
      deception: "dec",
      history: "his",
      insight: "ins",
      intimidation: "itm",
      investigation: "inv",
      medicine: "med",
      nature: "nat",
      perception: "prc",
      performance: "prf",
      persuasion: "per",
      religion: "rel",
      sleightOfHand: "slt",
      stealth: "ste",
      survival: "sur"
    };

    this.savesNames = {
      str: "Strength",
      dex: "Dexterity",
      con: "Constitution",
      int: "Intelligence",
      wis: "Wisdom",
      cha: "Charisma"
    };
    this.generateTray();
  }

  //PC
  //out of combat
  //in combat
  //NPC

  // {
  // name: "Name",
  // abbreviation: "abr",
  // type: "skill||save",
  // ability: "str||dex||con||int||wis||cha",
  // modifier: "int",
  // proficient: "0,1,2",
  //  }

  generateTray() {
    let actor = fromUuidSync(this.actorUuid);
    this.currentSkills = this.getSkillSets(
      actor,
      this.inCombat,
      this.characterClass
    );
  }

  static generateCustomTrays(actor) {
    return new SkillTray({
      actorUuid: actor.uuid
    });
  }

  generateSkillData(name = null, abbreviation = null, actor = null) {
    let skillAbbr = this.skillAbbr;
    if (!abbreviation) abbreviation = skillAbbr[abbreviation];
    if (!name)
      name = Object.keys(skillAbbr).find(
        key => skillAbbr[key] === abbreviation
      );
    if (!actor) {
      actor = fromUuidSync(this.actorUuid);
    }
    let skills = actor.system.skills[abbreviation];

    let skill = {
      name: name,
      abbreviation: abbreviation,
      type: "skill",
      ability: skills.ability,
      modifier: skills.total,
      proficient: skills.proficient
    };
    return skill;
  }

  generateSavingThrowData(abbreviation, actor = null) {
    if (!actor) {
      actor = fromUuidSync(this.actorUuid);
    }
    let saves = actor.system.abilities[`${abbreviation}`];
    let save = {
      name: this.savesNames[abbreviation],
      abbreviation: abbreviation,
      type: "save",
      ability: abbreviation,
      modifier: saves.value,
      proficient: saves.proficient
    };
    return save;
  }

  getSkillSets(actor, incombat = false, characterClass = null) {
    if (!actor) return;
    if (!characterClass) {
      //get class
      //set class skills
    }
    let defaultSkills = ["ath", "dec", "inv", "prc", "per", "ste"];
    let defaultClassSkills = ["acr", "his", "med", "nat", "slt", "sur"];
    const saves = ["str", "dex", "con", "int", "wis", "cha"];

    let classSkills = defaultClassSkills;

    let skills = [];

    switch (true) {
      case !incombat && !characterClass:
        //default skills default class skills

        defaultSkills.forEach(skill =>
          skills.push(this.generateSkillData(null, skill, actor))
        );

        defaultClassSkills.forEach(skill =>
          skills.push(this.generateSkillData(null, skill, actor))
        );
        break;

      case !incombat && characterClass:
        //default skills specific class skills

        defaultSkills.forEach(skill =>
          skills.push(this.generateSkillData(null, skill, actor))
        );

        classSkills.forEach(skill =>
          skills.push(this.generateSkillData(null, skill, actor))
        );
        break;

      case incombat && !characterClass:
        defaultSkills.forEach(skill =>
          skills.push(this.generateSkillData(null, skill, actor))
        );

        saves.forEach(save =>
          skills.push(this.generateSavingThrowData(save, actor))
        );
        break;

      case incombat && characterClass:
        //default Skills Saves

        classSkills.forEach(skill =>
          skills.push(this.generateSkillData(null, skill, actor))
        );

        saves.forEach(save =>
          skills.push(this.generateSavingThrowData(save, actor))
        );
        break;
    }
    return skills;
  }

  static padArray(arr, length = 20, filler = null) {
    if (arr == null) return new Array(length).fill(filler);
    return [...arr, ...Array(Math.max(0, length - arr.length)).fill(filler)];
  }
}
