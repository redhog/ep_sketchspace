eejs = require("ep_etherpad-lite/node/eejs");

exports.eejsBlock_editbarMenuLeft = function (hook_name, args, cb) {
  args.content = args.content + eejs.require("ep_sketchspace/templates/sketchSpaceEditbarButtons.ejs");
  return cb();
}

exports.eejsBlock_modals = function (hook_name, args, cb) {
  args.content = args.content + eejs.require("ep_sketchspace/templates/sketchSpaceModals.ejs");
  return cb();
}

exports.eejsBlock_scripts = function (hook_name, args, cb) {
  args.content = args.content + eejs.require("ep_sketchspace/templates/sketchSpaceScripts.ejs");
  return cb();
}

exports.eejsBlock_styles = function (hook_name, args, cb) {
  args.content = args.content + eejs.require("ep_sketchspace/templates/sketchSpaceStyles.ejs");
  return cb();
}
