(function () {
  var hooks = require("ep_etherpad-lite/static/js/pluginfw/hooks");

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
    templateString: '<div class="sketchSpaceEditorUI">' +
                    '    <div class="toolbar enabledtoolbar">' +
                    '      <ul class="menu_left">' +
                    '        <li id="addEllipse" dojoAttachEvent="onclick:_onAddEllipse">' +
                    '          <a title="Add ellipse"><span class="buttonicon buttonicon-addellipse"></span></a>' +
                    '        </li>' +
                    '        <li id="addPath" dojoAttachEvent="onclick:_onAddPath">' +
                    '          <a title="Add path"><span class="buttonicon buttonicon-addpath"></span></a>' +
                    '        </li>' +
                    '        <li id="addPathFreehand" dojoAttachEvent="onclick:_onAddPathFreehand">' +
                    '          <a title="Add path freehand"><span class="buttonicon buttonicon-addpathfreehand"></span></a>' +
                    '        </li>' +
                    '        <li id="addPathPolyline" dojoAttachEvent="onclick:_onAddPathPolyline">' +
                    '          <a title="Add path polyline"><span class="buttonicon buttonicon-addpathpolyline"></span></a>' +
                    '        </li>' +
                    '        <li id="addRect" dojoAttachEvent="onclick:_onAddRect">' +
                    '          <a title="Add rect"><span class="buttonicon buttonicon-addrect"></span></a>' +
                    '        </li>' +
                    hooks.callAllStr("sketchSpaceDesigner_designer_DesignerUI_ToolbarAdd", {}, " ") +
                    '        <li class="separator"></li>' +
                    '        <li id="select" dojoAttachEvent="onclick:_onSelect">' +
                    '          <a title="Select objects"><span class="buttonicon buttonicon-select"></span></a>' +
                    '        </li>' +
                    hooks.callAllStr("sketchSpaceDesigner_designer_DesignerUI_ToolbarSelect", {}, " ") +
                    '        <li class="separator"></li>' +
                    '        <li id="pan" dojoAttachEvent="onclick:_onPan">' +
                    '          <a title="Pan"><span class="buttonicon buttonicon-pan"></span></a>' +
                    '        </li>' +
                    '        <li id="zoomIn" dojoAttachEvent="onclick:_onZoomIn">' +
                    '          <a title="Zoom in"><span class="buttonicon buttonicon-zoomin"></span></a>' +
                    '        </li>' +
                    '        <li id="zoomDefault" dojoAttachEvent="onclick:_onZoomDefault">' +
                    '          <a title="Zoom default"><span class="buttonicon buttonicon-zoomdefault"></span></a>' +
                    '        </li>' +
                    '        <li id="zoomOut" dojoAttachEvent="onclick:_onZoomOut">' +
                    '          <a title="Zoom out"><span class="buttonicon buttonicon-zoomout"></span></a>' +
                    '        </li>' +
                    hooks.callAllStr("sketchSpaceDesigner_designer_DesignerUI_Toolbar", {}, " ") +
                    '      </ul>' +
                    '      <ul class="menu_right">' +
                    '        <li id="syncView">' +
                    '          Sync view: <div dojoAttachPoint="shareCurrentImageOptionDiv"></div>' +
                    '        </li>' +
                    '        <li id="authorshipColors">' +
                    '          Authorship colors: <div dojoAttachPoint="showAuthorshipColorOptionDiv"></div>' +
                    '        </li>' +
                    '        <li id="maximize" dojoAttachEvent="onclick:_onMaximize">' +
                    '            <a title="Maximize"><span class="buttonicon buttonicon-maximize"></span></a>' +
                    '        </li>' +
                    '        <li id="about">' +
                    '            <a title="About SketchSpace" href="http://github.com/redhog/pad"><span class="buttonicon buttonicon-about"></span></a>' +
                    '        </li>' +
                    '      </ul>' +
                    '    </div>' +
                    '    <div id="sketchSpaceEditor" dojoAttachPoint="editorArea"></div>' +
                    '  <div id="sketchSpaceOptions" dojoType="sketchSpaceDesigner.designer.widgets.OptionsContainer" dojoAttachPoint="options"></div>' +
                    '</div>',
    startup: function () {
      this.inherited(arguments);

      hooks.callAll("sketchSpaceDesigner_designer_DesignerUI_startup", {widget:this, arguments:arguments});

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
})();
