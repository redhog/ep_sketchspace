eejs = require("ep_etherpad-lite/node/eejs");
var util = require('util');
var child_process = require('child_process');
var path = require('path');

exports.eejsBlock_editbarMenuLeft = function (hook_name, args, cb) {
  args.content = args.content + eejs.require("ep_sketchspace/templates/sketchSpaceEditbarButtons.ejs", {}, module);
  return cb();
}

exports.eejsBlock_modals = function (hook_name, args, cb) {
  args.content = args.content + eejs.require("ep_sketchspace/templates/sketchSpaceModals.ejs", {}, module);
  return cb();
}

exports.eejsBlock_scripts = function (hook_name, args, cb) {
    args.content = args.content + eejs.require("ep_sketchspace/templates/sketchSpaceScripts.ejs", {}, module);
  return cb();
}

exports.eejsBlock_styles = function (hook_name, args, cb) {
  args.content = args.content + eejs.require("ep_sketchspace/templates/sketchSpaceStyles.ejs", {}, module);
  return cb();
}

exports.init = function(hook_name, args, cb) {
  child_process.spawn(path.join(__dirname, "build.sh"), [], {customFds: [0, 1, 2]}).on('exit', function (code, signal) {
    cb();
  });
}
