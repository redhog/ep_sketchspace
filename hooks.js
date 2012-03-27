import("etherpad.log");
import("faststatic");
import("etherpad.utils.*");
import("etherpad.globals.*");
import("dispatch.{Dispatcher,PrefixMatcher,forward}");
import("etherpad.helpers");

function editBarItemsLeftPad(arg) {
  return arg.template.include('sketchSpaceEditbarButtons.ejs', undefined, ['sketchSpace']);
}

function editBarItemsLeftPadView(arg) {
  helpers.includeCss("plugins/sketchSpace/ace.css");
  helpers.includeJs("plugins/sketchSpace/ace_inner.js");
}


function modals(arg) {
  return arg.template.include('sketchSpaceModals.ejs', undefined, ['sketchSpace']);
}
