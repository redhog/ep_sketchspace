dojo.provide("sketchSpaceDesigner.main");

dojo.require("sketchSpaceDesigner.designer.ui");
dojo.require("dojox.uuid.generateRandomUuid");
dojo.require("dojo.i18n");

var sketchSpace = require("ep_sketchspace/static/js/main");

sketchSpace.initEditor.init = function () {
  sketchSpace.editorUi = new sketchSpaceDesigner.designer.DesignerUI({userId: typeof(pad) != "undefined" ? pad.getUserId() : undefined}, dojo.byId("sketchSpaceEditorUI"));

//  makeResizableHPane($(".editorui"), $("#sketchSpaceEditorVdraggie"), $("#padpage"), 0, 0, 10, -22, function () { sketchSpace.editorUi.editor.resize(); $(window).trigger("resize"); });

  sketchSpace.editorUi.startup();

  dojo.connect(sketchSpace.editorUi.editor, "imageUpdatedByUs", sketchSpace, sketchSpace.updatePadFromImage);
  dojo.connect(sketchSpace.editorUi.editor, "selectImage", sketchSpace, sketchSpace.updateImageFromPadIfNeeded);

  if (typeof(pad) != "undefined") {
    var info = {  
      action: '/fileUpload/',
      name: 'uploadfile',  
      onSubmit: function(file, ext){
      //console.log('Starting...');
      },  
      onComplete: function(file, response){
	var path = eval(response)[0].split("/");
	var filename = path[path.length-1];

	dojo.xhrGet({
	  url: "/imageConvert/" + filename + "?action=getPages",
	  handleAs: "json",
	  load: function(data){
	    padeditor.ace.callWithAce(function (ace) {
	      for (var page = 0; page < data.pages; page++) {

		var imageId = sketchSpace.ace_insertImage(ace);
		var rep = ace.ace_getRep();
		ace.ace_performDocumentApplyAttributesToRange(rep.selStart, rep.selEnd, [["sketchSpaceImageObject:" + dojox.uuid.generateRandomUuid(), escape(dojo.toJson({parent:null, shape: {extType: "zimage", imageName: filename, page:page}}))]]);
		ace.ace_performSelectionChange(rep.selEnd, rep.selEnd, false);

	      }
	    }, "sketchSpace", true)
	  }
	});

      }
    }

    // FIXME:
    // new AjaxUpload($('.sketchSpaceAddPdfImage'), info);  
    // new AjaxUpload($('.sketchSpaceAddPdfImage img'), info);
  }
};

dojo.addOnLoad(function (){
  sketchSpace.initEditor.emit("dojo");
});



dojo.i18n.getLocalization = function(/*String*/packageName, /*String*/bundleName, /*String?*/locale){
	//	summary:
	//		Returns an Object containing the localization for a given resource
	//		bundle in a package, matching the specified locale.
	//	description:
	//		Returns a hash containing name/value pairs in its prototypesuch
	//		that values can be easily overridden.  Throws an exception if the
	//		bundle is not found.  Bundle must have already been loaded by
	//		`dojo.requireLocalization()` or by a build optimization step.  NOTE:
	//		try not to call this method as part of an object property
	//		definition (`var foo = { bar: dojo.i18n.getLocalization() }`).  In
	//		some loading situations, the bundle may not be available in time
	//		for the object definition.  Instead, call this method inside a
	//		function that is run after all modules load or the page loads (like
	//		in `dojo.addOnLoad()`), or in a widget lifecycle method.
	//	packageName:
	//		package which is associated with this resource
	//	bundleName:
	//		the base filename of the resource bundle (without the ".js" suffix)
	//	locale:
	//		the variant to load (optional).  By default, the locale defined by
	//		the host environment: dojo.locale

	locale = dojo.i18n.normalizeLocale(locale);

	// look for nearest locale match
	var elements = locale.split('-');
	var module = [packageName,"nls",bundleName].join('.');
	//>>includeStart("asyncLoader", kwArgs.asynchLoader);
	if (typeof dojo.require !== "undefined") {
		// XXX: this only works for the default locale
                // The hack: Use dojo.require, not require, don't prefix path with "i18n!" and use obj.ROOT, not just obj.root...
                // FIXME: I have no idea why this is required...
		var obj = dojo.require([packageName, "nls", bundleName].join('.'));
		(dojo._loadedModules[module] = dojo._loadedModules[module] || {})[elements.join('_')] = (obj.ROOT || obj.root || obj);
	}
	//>>includeEnd("asyncLoader");
	var bundle = dojo._loadedModules[module];
	if(bundle){
		var localization;
		for(var i = elements.length; i > 0; i--){
			var loc = elements.slice(0, i).join('_');
			if(bundle[loc]){
				localization = bundle[loc];
				break;
			}
		}
		if(!localization){
			localization = bundle.ROOT;
		}

		// make a singleton prototype so that the caller won't accidentally change the values globally
		if(localization){
			var clazz = function(){};
			clazz.prototype = localization;
			return new clazz(); // Object
		}
	}

	throw new Error("Bundle not found: " + bundleName + " in " + packageName+" , locale=" + locale);
};
