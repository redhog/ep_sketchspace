import("etherpad.log");
import("plugins.sketchSpace.hooks");
import("plugins.sketchSpace.static.js.main");

function sketchSpaceInit() {
 this.hooks = ['editBarItemsLeftPad', 'aceAttribsToClasses', 'aceCreateDomLine', 'modals', 'editBarItemsLeftPadView'];
 this.description = 'sketchSpace';
 this.client = new main.sketchSpaceInit();
 this.editBarItemsLeftPad = hooks.editBarItemsLeftPad;
 this.editBarItemsLeftPadView = hooks.editBarItemsLeftPadView;
 this.aceAttribsToClasses = this.client.aceAttribsToClasses;
 this.aceCreateDomLine = this.client.aceCreateDomLine;
 this.modals = hooks.modals;
 this.install = install;
 this.uninstall = uninstall;

 // This is a stub for the editor API so that aceCreateDomLine etc will work...
 this.editorUi = {editor:{images:[], currentImage: undefined, selectSharedImage: function () {}}};
}

function install() {
 log.info("Installing sketchSpace");
}

function uninstall() {
 log.info("Uninstalling sketchSpace");
}

