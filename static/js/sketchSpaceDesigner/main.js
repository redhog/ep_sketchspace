dojo.provide("sketchSpaceDesigner.main");

dojo.require("sketchSpaceDesigner.designer.ui");
dojo.require("dojox.uuid.generateRandomUuid");

dojo.addOnLoad(function (){
  sketchSpace.editorUi = new sketchSpaceDesigner.designer.DesignerUI({userId: typeof(pad) != "undefined" ? pad.getUserId() : undefined}, dojo.byId("sketchSpaceEditorUI"));

  makeResizableHPane($(".editorui"), $("#sketchSpaceEditorVdraggie"), $("#padpage"), 0, 0, 10, -22, function () { sketchSpace.editorUi.editor.resize(); $(window).trigger("resize"); });

  sketchSpace.editorUi.startup();

  dojo.connect(sketchSpace.editorUi.editor, "imageUpdatedByUs", sketchSpace, sketchSpace.updatePadFromImage);
  dojo.connect(sketchSpace.editorUi.editor, "selectImage", sketchSpace, sketchSpace.updateImageFromPadIfNeeded);


  if (typeof(pad) != "undefined") {
    var info = {  
      action: '/ep/fileUpload/',
      name: 'uploadfile',  
      onSubmit: function(file, ext){
      //console.log('Starting...');
      },  
      onComplete: function(file, response){
	var path = eval(response)[0].split("/");
	var filename = path[path.length-1];

	dojo.xhrGet({
	  url: "/ep/imageConvert/" + filename + "?action=getPages",
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

    new AjaxUpload($('.sketchSpaceAddPdfImage'), info);  
    new AjaxUpload($('.sketchSpaceAddPdfImage img'), info);
  }
});
