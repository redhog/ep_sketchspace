dojo.provide("sketchSpaceDesigner.designer.ui");

dojo.require("sketchSpaceDesigner.designer.editor");
dojo.require("sketchSpaceDesigner.designer.widgets");
dojo.require("dojo.parser");
dojo.require("dojox.layout.TableContainer");
dojo.require("dijit.layout.ContentPane");
dojo.require("dijit._Widget");
dojo.require("dijit._Templated");

dojo.declare("sketchSpaceDesigner.designer.DesignerUI", [dijit._Widget, dijit._Templated], {
  widgetsInTemplate: true,
  templateString: '<div>' +
                  '  <div class="editorui">' +
                  '    <div id="editbar" class="enabledtoolbar">' +
                  '      <ul id="menu_left">' +
                  '        <li id="addImage" dojoAttachPoint="addImgButton">' +
                  '          <a class="buttonicon buttonicon-addimage" title="Add image"></a>' +
                  '        </li>' +
                  '        <li id="addEllipse" dojoAttachEvent="onclick:_onAddEllipse">' +
                  '          <a class="buttonicon buttonicon-addellipse" title="Add ellipse"></a>' +
                  '        </li>' +
                  '        <li id="addPath" dojoAttachEvent="onclick:_onAddPath">' +
                  '          <a class="buttonicon buttonicon-addpath" title="Add path"></a>' +
                  '        </li>' +
                  '        <li id="addPathFreehand" dojoAttachEvent="onclick:_onAddPathFreehand">' +
                  '          <a class="buttonicon buttonicon-addpathfreehand" title="Add path freehand"></a>' +
                  '        </li>' +
                  '        <li id="addPathPolyline" dojoAttachEvent="onclick:_onAddPathPolyline">' +
                  '          <a class="buttonicon buttonicon-addpathpolyline" title="Add path polyline"></a>' +
                  '        </li>' +
                  '        <li id="addRect" dojoAttachEvent="onclick:_onAddRect">' +
                  '          <a class="buttonicon buttonicon-addrect" title="Add rect"></a>' +
                  '        </li>' +
                  '        <li class="separator"></li>' +
                  '        <li id="pan" dojoAttachEvent="onclick:_onPan">' +
                  '          <a class="buttonicon buttonicon-pan" title="Pan"></a>' +
                  '        </li>' +
                  '        <li id="zoomIn" dojoAttachEvent="onclick:_onZoomIn">' +
                  '          <a class="buttonicon buttonicon-zoomin" title="Zoom in"></a>' +
                  '        </li>' +
                  '        <li id="zoomDefault" dojoAttachEvent="onclick:_onZoomDefault">' +
                  '          <a class="buttonicon buttonicon-zoomdefault" title="Zoom default"></a>' +
                  '        </li>' +
                  '        <li id="zoomOut" dojoAttachEvent="onclick:_onZoomOut">' +
                  '          <a class="buttonicon buttonicon-zoomout" title="Zoom out"></a>' +
                  '        </li>' +
                  '      </ul>' +
                  '      <ul id="menu_right">' +
                  '        <li id="syncView">' +
                  '          Sync view: <div dojoAttachPoint="shareCurrentImageOptionDiv"></div>' +
                  '        </li>' +
                  '        <li id="authorshipColors">' +
                  '          Authorship colors: <div dojoAttachPoint="showAuthorshipColorOptionDiv"></div>' +
                  '        </li>' +
                  '        <li id="maximize" onclick="_onMaximize();return false;">' +
                  '            <a class="buttonicon buttonicon-maximize" title="Maximize"></a>' +
                  '        </li>' +
                  '        <li>' +
                  '            <a class="" title="About SketchSpace" href="http://github.com/redhog/pad">SketchSpace</a>' +
                  '        </li>' +
                  '      </ul>' +
                  '    </div>' +
                  '    <div id="sketchSpaceEditor" dojoAttachPoint="editorArea"></div>' +
                  '  </div>' +
                  '  <div id="sketchSpaceOptions" dojoType="sketchSpaceDesigner.designer.widgets.OptionsContainer" dojoAttachPoint="options"></div>' +
                  '</div>',
  startup: function () {
    this.inherited(arguments);

    if (typeof(AjaxUpload) != "undefined") {
      var info = {  
        action: '/ep/fileUpload/',
        name: 'uploadfile',  
        onSubmit: function(file, ext){
        //console.log('Starting...');
        },  
        onComplete: function(file, response){
          var path = eval(response)[0].split("/");
          sketchSpace.editorUi.addImg(path[path.length-1]);
        }
      };
      new AjaxUpload($(this.addImgButton), info);  
    }

    this.editor = new sketchSpaceDesigner.designer.editor.Editor(this.editorArea, this.attr("userId"), this, typeof(pad) == "undefined");

    var editor = this.editor;
    function resizeUntilDone () {
      if (!editor.resize())
        window.setTimeout(resizeUntilDone, 1000);
    }
    resizeUntilDone();

    dojo.connect(this.editor, "selectImage", this, this.onSelectImage);
    dojo.connect(this.editor, "deselectImage", this, this.onDeselectImage);

    this.selectToolIcon("select");

    if (typeof(pad) == "undefined")
      $(this.toolbar).find(".tools").css({display:"none"});

    this.shareCurrentImageOption = new sketchSpaceDesigner.designer.widgets.OptionCheckBox({title:"Shared image selection:", optionsPath:"shareCurrentImage", designer:this.editor}, this.shareCurrentImageOptionDiv);
    this.shareCurrentImageOption.startup();
    this.showAuthorshipColorOption = new sketchSpaceDesigner.designer.widgets.OptionCheckBox({title:"Show authorship:", optionsPath:"showAuthorshipColors", designer:this.editor}, this.showAuthorshipColorOptionDiv);   
    this.showAuthorshipColorOption.startup();

    $("body").addClass("noSketchSpace");
  },
  _onMaximize: function () {
    $('body').toggleClass('sketchSpaceMaximized');
    $(window).trigger("resize");
  },
  onSelectImage: function (imageId) {
    $("body").addClass("sketchSpace");
    $("body").removeClass("noSketchSpace");
    $(window).trigger("resize");  },

  onDeselectImage: function (imageId) {
    $("body").removeClass("sketchSpace");
    $("body").addClass("noSketchSpace");
    $(window).trigger("resize");
   },

  selectToolIcon: function(name) {
    $(this.toolbar).find(".tool").css({background: "#ffffff"});
    $(this.toolbar).find(".tool." + name).css({background: "#cccccc"});
  },

  _onAddEllipse: function() {
    this.editor.setMode(new sketchSpaceDesigner.designer.modes.AddEllipse());
    this.selectToolIcon("addEllipse");
  },

  _onAddPath: function() {
    this.editor.setMode(new sketchSpaceDesigner.designer.modes.AddPath());
    this.selectToolIcon("addPath");
  },

  _onAddPathFreehand: function() {
    this.editor.setMode(new sketchSpaceDesigner.designer.modes.AddPathFreehand());
    this.selectToolIcon("addPathFreehand");
  },

  _onAddPathPolyline: function() {
    this.editor.setMode(new sketchSpaceDesigner.designer.modes.AddPathPolyline());
    this.selectToolIcon("addPathPolyline");
  },

  _onAddRect: function() {
    this.editor.setMode(new sketchSpaceDesigner.designer.modes.AddRect());
    this.selectToolIcon("addRect");
  },

  addImg: function(imageName) {
    var shape = this.editor.createImage(this.editor.surface_transform, imageName);
    this.editor.setShapeFillAndStroke(shape, this.editor.options);
    this.editor.registerObjectShape(shape);
    this.editor.saveShapeToStr(shape);
  },

  _onSelect: function() {
    this.editor.setMode(new sketchSpaceDesigner.designer.modes.Select());
    this.selectToolIcon("select");
  },

  _onZoomIn: function() {
    this.editor.setMode(new sketchSpaceDesigner.designer.modes.ZoomPlus(true));
    this.selectToolIcon("zoomIn");
  },

  _onZoomDefault: function() {
    this.editor.surface_transform.setTransform(dojox.gfx.matrix.identity);
  },

  _onZoomOut: function() {
    this.editor.setMode(new sketchSpaceDesigner.designer.modes.ZoomPlus(false));
    this.selectToolIcon("zoomOut");
  },

  _onPan: function() {
    this.editor.setMode(new sketchSpaceDesigner.designer.modes.PanPlus(false));
    this.selectToolIcon("pan");
  }

});
