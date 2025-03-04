export function registerHandlebarsHelpers() {
  Handlebars.registerHelper("indexRange", function(v1, v2, v3, options) {
    if (parseInt(v1) <= v2 && v2 < parseInt(v3)) {
      return options.fn(this);
    }
    return options.inverse(this);
  });

  Handlebars.registerHelper("eq", function(a, b) {
    return a === b;
  });
}
