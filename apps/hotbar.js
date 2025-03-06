const { ApplicationV2 } = foundry.applications.api;
const { api, sheets } = foundry.applications;
import { AbilityTray } from './components/abilityTray.js';
import { CustomTray } from './components/customtray.js';
import { StaticTray } from './components/staticTray.js';
import { registerHandlebarsHelpers } from './helpers/handlebars.js';

export class AutoActionTray extends api.HandlebarsApplicationMixin(
  ApplicationV2
) {
  // Constructor

  constructor(options = {}) {
    super(options);

    this.abilityHeight = 2;

    this.section1Width = 3;
    this.section2Width = 4;
    this.section3Width = 2;
    this.abilityHeight = 2;

    this.section1Total = this.section1Width * this.abilityHeight;
    this.section2Total = this.section2Width * this.abilityHeight;
    this.section3Total = this.section3Width * this.abilityHeight;

    this.section1End = this.section1Total;
    this.section2End = this.section1End + this.section2Total;
    this.section3End = this.section2End + this.section3Total;

    this.totalabilities =
      this.section1Total + this.section2Total + this.section3Total;

    this.section1Px = this.section1Width * 78;
    this.section2Px = this.section2Width * 78;
    this.section3Px = this.section3Width * 78;
    this.totalWidthPx = (this.totalabilities / this.abilityHeight) * 78;
    this.#dragDrop = this.#createDragDropHandlers();

    this.isEditable = true;

    this.actor = null;
    this.meleeWeapon = null;
    this.rangedWeapon = null;

    this.currentTray = null;

    this.currentTrayTemplate = 'AAT.full-tray';

    this.allAbilities = {};

    this.customTrays = [];
    this.staticTrays = [];

    this.abilities = new Array(this.totalabilities).fill(null);
    this.init = false;
    Hooks.on('controlToken', this._onControlToken);
    Hooks.on('updateActor', this._onUpdateActor.bind(this));
    Hooks.on('updateItem', this._onUpdateItem.bind(this));

    registerHandlebarsHelpers();
  }

  setDefaultTray() {
    let targetTray = this.customTrays.find((e) => e.id == 'common');
    this.abilities = this.padArray(targetTray.abilities, this.totalabilities);
    this.currentTray = targetTray;
    this.render();
  }

  _onUpdateItem(item, change, options, userId) {
    if (item.actor != this.actor) return;
    this.staticTrays = StaticTray.generateStaticTrays(this.actor);
    this.refresh();
  }

  _onUpdateActor(actor, change, options, userId) {
    if (actor != this.actor) return;
    // if (item.actor != this.actor) return;
    this.staticTrays = StaticTray.generateStaticTrays(this.actor);
    this.refresh();
  }
  _onControlToken = (event) => {
    if (event == null) {
      return;
    }
    if (event.actor != this.actor || this.actor == event) {
      this.actor = event.actor ? event.actor : event;
      this.staticTrays = StaticTray.generateStaticTrays(this.actor);
      this.customTrays = CustomTray.generateCustomTrays(this.actor);
      this.setDefaultTray();
      this.meleeWeapon = this.actor.items.filter(
        (e) =>
          (e.system.type?.value === 'simpleM' ||
            e.system.type?.value === 'martialM') &&
          e.system.equipped
      )[0];
      this.rangedWeapon = this.actor.items.filter(
        (e) =>
          (e.system.type?.value === 'simpleR' ||
            e.system.type?.value === 'martialR') &&
          e.system.equipped
      )[0];
    }
    this.refresh();
  };

  refresh = () => {
    if (this.actor == null) return;
    this.currentTray = this.staticTrays.find((e) => e.id == this.currentTray.id)
      ? this.staticTrays.find((e) => e.id == this.currentTray.id)
      : this.customTrays.find((e) => e.id == this.currentTray.id);

    this.abilities = this.padArray(
      this.currentTray.abilities,
      this.totalabilities
    );
    this.render(true);
  };

  static DEFAULT_OPTIONS = {
    tag: 'div',
    dragDrop: [{ dragSelector: '[data-drag]', dropSelector: null }],
    // dragDrop: [{ dragSelector: '.item-button', dropSelector: null }],
    form: {
      handler: AutoActionTray.myFormHandler,
      submitOnChange: false,
      closeOnSubmit: false,
    },
    window: {
      frame: false,
      positioned: false,
    },

    // position: { width: 1500, height: 250, top: 1000, zIndex: 1000 },
    actions: {
      openSheet: AutoActionTray.openSheet,
      selectWeapon: AutoActionTray.selectWeapon,
      useItem: AutoActionTray.useItem,
      setTray: AutoActionTray.setTray,
      endTurn: AutoActionTray.endTurn,
    },
  };

  /**
   * @typedef {Object} HandlebarsTemplatePart
   * @property {string} template                      The template entry-point for the part
   * @property {string} [id]                          A CSS id to assign to the top-level element of the rendered part.
   *                                                  This id string is automatically prefixed by the application id.
   * @property {string[]} [classes]                   An array of CSS classes to apply to the top-level element of the
   *                                                  rendered part.
   * @property {string[]} [templates]                 An array of templates that are required to render the part.
   *                                                  If omitted, only the entry-point is inferred as required.
   * @property {string[]} [scrollable]                An array of selectors within this part whose scroll positions should
   *                                                  be persisted during a re-render operation. A blank string is used
   *                                                  to denote that the root level of the part is scrollable.
   * @property {Record<string, ApplicationFormConfiguration>} [forms]  A registry of forms selectors and submission handlers.
   */

  static PARTS = {
    part1: {
      template: 'modules/auto-action-tray/templates/character-tray.hbs',
      id: 'tray',
    },
  };

  /**
   * Process form submission for the sheet
   * @this {AutoActionTray}                      The handler is called with the application as its bound scope
   * @param {SubmitEvent} event                   The originating form submission event
   * @param {HTMLFormElement} form                The form element that was submitted
   * @param {FormDataExtended} formData           Processed data for the submitted form
   * @returns {Promise<void>}
   */
  static async myFormHandler(event, form, formData) {
    // Do things with the returned FormData
  }

  /**
   * Prepare context that is specific to only a single rendered part.
   *
   * It is recommended to augment or mutate the shared context so that downstream methods like _onRender have
   * visibility into the data that was used for rendering. It is acceptable to return a different context object
   * rather than mutating the shared context at the expense of this transparency.
   *
   * @param {string} partId                         The part being rendered
   * @param {ApplicationRenderContext} context      Shared context provided by _prepareContext
   * @returns {Promise<ApplicationRenderContext>}   Context data for a specific part
   * @protected
   */
  async _preparePartContext(partId, context) {
    context = {
      partId: `${this.id}-${partId}`,
      actor: this.actor,
      meleeWeapon: this.meleeWeapon,
      rangedWeapon: this.rangedWeapon,
      spells: this.spells,
      consumables: this.consumables,
      abilities: this.abilities,
      // section1: this.section1,
      // section2: this.section2,
      // section3: this.section3,
      section1Px: this.section1Px,
      section2Px: this.section2Px,
      section3Px: this.section3Px,
      totalWidthPx: this.totalWidthPx,
      section1Total: this.section1Total,
      section2Total: this.section2Total,
      section3Total: this.section3Total,
      section1End: this.section1End,
      section2End: this.section2End,
      section3End: this.section3End,
      totalabilities: this.totalabilities,
      currentTrayTemplate: this.currentTrayTemplate,
      currentTray: this.currentTray,
      allAbilities: this.allAbilities,
      staticTrays: this.staticTrays,
      staticTray: this.staticTray,
    };

    return context;
  }

  _configureRenderOptions(options) {
    super._configureRenderOptions(options);
  }

  _attachFrameListeners() {
    super._attachFrameListeners();
    // this.element.addEventListener("pointerdown", (event) => {
    //   debugger
    //   if (event.button !=2 || event.target.dataset.itemId == null ) return;
    //      console.log(event)
    //      console.log(event.target, event.button, event.buttons)

    // })

    let itemContextMenu = [
      {
        name: 'DND5E.ItemView',
        icon: '<i class="fas fa-eye"></i>',
        callback: (li) => {
          this._onAction(li[0], 'view');
        },
      },
      //     {
      //       name: "DND5E.ContextMenuActionEdit",
      //       icon: "<i class='fas fa-edit fa-fw'></i>",
      //       // condition: () => item.isOwner && !compendiumLocked,
      //       callback: li => this._onAction(li[0], "edit")
      // },
      {
        name: 'Remove',
        icon: "<i class='fas fa-trash fa-fw'></i>",
        // condition: () => item.canDelete && item.isOwner && !compendiumLocked,
        callback: (li) => this._onAction(li[0], 'remove'),
      },
    ];

    new ContextMenu(this.element, '.ability-button', itemContextMenu, {
      onOpen: this._onOpenContextMenu(),
      jQuery: true,
    });
  }

  _onOpenContextMenu(event) {
    return;
  }

  _onAction(li, action) {
    // console.log(li, action, li.dataset.itemId)

    switch (action) {
      case 'view':
        this.actor.items.get(li.dataset.itemId).sheet.render(true);
        break;
      // case "edit":
      //   this.actor.items.get(li.dataset.itemId).sheet.render(true);
      //   break;
      case 'remove':
        // //CHANGE THIS TO USE THE CURRENT TRAY
        // this.abilities[li.dataset.index] = null;
        // this.setAbilities();
        this.render(true);
        break;
    }
  }

  static openSheet(event, target) {
    this.actor.sheet.render(true);
  }

  static async endTurn(event, target) {
    this.actor.unsetFlag('auto-action-tray', 'data');
    gsap.to('.custom-tray', { opacity: 0, x: 1000, duration: 1 });
    gsap.to('.static-tray', { opacity: 0, y: -200, duration: 1 });
    await setTimeout(() => {
      // gsap.to('.abilities-tray', { opacity: 1, x: 0, duration: 1 });
    }, 2000); // 2000ms = 2 seconds
  }

  static setTray(event, target) {
    let targetTray;
    if (target.dataset.type === 'static') {
      this.currentTrayTemplate = 'AAT.full-tray';
      targetTray = this.staticTrays[target.dataset.index];
      this.abilities = this.padArray(targetTray.abilities, this.totalabilities);
      this.currentTray = targetTray;
    } else {
      this.currentTrayTemplate = 'AAT.full-tray';
      targetTray = this.customTrays.find((e) => e.id == target.dataset.id);
      this.abilities = this.padArray(targetTray.abilities, this.totalabilities);
      this.currentTray = targetTray;
      this.currentTray.getAbilities();
    }
    switch (target.dataset.id) {
      case 'action':
        break;
      case 'bonus':
        break;
      case 'class':
        break;
      case 'spell':
        break;
    }
    this.render(true);
  }

  padArray(arr, length = 20, filler = null) {
    if (arr == null) return new Array(length).fill(filler);
    return [...arr, ...Array(Math.max(0, length - arr.length)).fill(filler)];
  }

  static async useItem(event, target) {
    let itemId = target.dataset.itemId;
    let item = this.actor.items.get(itemId);
    await item.use();
  }

  static selectWeapon(event, target) {
    if (target.classList.contains('selected')) {
      target.classList.remove('selected');
      return;
    }
    target.classList.add('selected');
  }

  #createDragDropHandlers() {
    return this.options.dragDrop.map((d) => {
      d.permissions = {
        dragstart: this._canDragStart.bind(this),
        drop: this._canDragDrop.bind(this),
      };
      d.callbacks = {
        dragstart: this._onDragStart.bind(this),
        dragover: this._onDragOver.bind(this),
        drop: this._onDrop.bind(this),
      };
      return new DragDrop(d);
    });
  }

  #dragDrop;

  // Optional: Add getter to access the private property

  /**
   * Returns an array of DragDrop instances
   * @type {DragDrop[]}
   */
  get dragDrop() {
    return this.#dragDrop;
  }
  /**
   * Actions performed after any render of the Application.
   * Post-render steps are not awaited by the render process.
   * @param {ApplicationRenderContext} context      Prepared context data
   * @param {RenderOptions} options                 Provided render options
   * @protected
   */
  _onRender(context, options) {
    this.#dragDrop.forEach((d) => d.bind(this.element));
  }

  /**
   * Define whether a user is able to begin a dragstart workflow for a given drag selector
   * @param {string} selector       The candidate HTML selector for dragging
   * @returns {boolean}             Can the current user drag this selector?
   * @protected
   */
  _canDragStart(selector) {
    // game.user fetches the current user

    return this.isEditable;
  }

  /**
   * Define whether a user is able to conclude a drag-and-drop workflow for a given drop selector
   * @param {string} selector       The candidate HTML selector for the drop target
   * @returns {boolean}             Can the current user drop on this selector?
   * @protected
   */
  _canDragDrop(selector) {
    // game.user fetches the current user

    return this.isEditable;
  }

  /**
   * Callback actions which occur at the beginning of a drag start workflow.
   * @param {DragEvent} event       The originating DragEvent
   * @protected
   */
  _onDragStart(event) {
    game.tooltip.deactivate();
    const li = event.currentTarget;

    if (event.target.classList.contains('content-link')) return;

    // Extract the data you need
    // let dragData = null;
    // if (!dragData) return;

    if (li.dataset.itemId === undefined) return;
    const effect = this.actor.items.get(li.dataset.itemId);
    let data = effect.toDragData();
    data.section = li.dataset.section;
    data.index = li.dataset.index;
    if (effect) event.dataTransfer.setData('text/plain', JSON.stringify(data));

    return;
    // Set data transfer
    // event.dataTransfer.setData('text/plain', JSON.stringify(dragData));
  }

  /**
   * Callback actions which occur when a dragged element is over a drop target.
   * @param {DragEvent} event       The originating DragEvent
   * @protected
   */
  _onDragOver(event) {}

  /**
   * Callback actions which occur when a dragged element is dropped on a target.
   * @param {DragEvent} event       The originating DragEvent
   * @protected
   */

  async _onDrop(event) {
    // Try to extract the data

    const dragData =
      event.dataTransfer.getData('application/json') ||
      event.dataTransfer.getData('text/plain');
    if (!dragData) return;
    //super._onDrop(event);
    let data;
    try {
      data = JSON.parse(dragData);
    } catch (e) {
      console.error(e);
      return;
    }

    let target = this.actor.items.get(event.target.dataset.itemId);

    let index = event.target.dataset.index;
    if (!index) return;

    // Handle different data types
    switch (data.type) {
      case 'Item':
        let item = fromUuidSync(data.uuid);
        this.currentTray.setAbility(index, item);
        this.currentTray.setAbility(data.index, null);
        this.abilities = this.padArray(
          this.currentTray.getAbilities(),
          this.totalabilities
        );
        this.render(true);
        break;

      default:
        return;
    }
  }
}
