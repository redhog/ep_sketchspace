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
                  '    <div class="topbar">' +
                  '      <div class="topbarleft"><!-- --></div>' +
                  '      <div class="topbarright"><!-- --></div>' +
                  '      <div class="topbarcenter">' +
                  '        <a href="http://github.com/redhog/pad" class="topbarBrand">SketchSpace</a>' +
                  '        <div class="fullscreen" dojoAttachEvent="onclick:_onMaximize">Full screen</div>' +
                  '        <a href="javascript:void(0);" dojoAttachEvent="onclick:_onMaximize" class="topbarmaximize" title="Toggle maximization"></a>' +
                  '      </div>' +
                  '      <div class="specialkeyarea"><!-- --></div>' +
                  '    </div>' +
                  '    <div id="sketchSpaceDocbar" class="menu docbar docbar-public">' +
                  '      <table border="0" cellpadding="0" cellspacing="0" width="100%" id="docbartable" class="docbartable">' +
                  '        <tbody><tr>' +
                  '          <td><img src="/static/img/jun09/pad/roundcorner_left.gif"></td>' +
                  '          <td width="100%">&nbsp;</td>' +
                  '          <td class="docbarbutton"><a dojoAttachPoint="addImgButton">Add PDF background</a></td>' +
                  '          <td class="docbarbutton">Sync view: <div dojoAttachPoint="shareCurrentImageOptionDiv"></div></td>' +
                  '          <td class="docbarbutton">Authorship colors: <div dojoAttachPoint="showAuthorshipColorOptionDiv"></div></td>' +
                  '          <td><img src="/static/img/jun09/pad/roundcorner_right_orange.gif"></td>' +
                  '        </tbody>' +
                  '      </table>' +
                  '    </div>' +
                  '    <div id="sketchSpaceEditBar" dojoAttachPoint="toolbar">' +
                  '      <div class="editbar enabledtoolbar" id="editbar">' +
                  '        <div class="editbarinner" id="editbarinner">' +
                  '          <div class="editbarleft" id="editbarleft"><!-- --></div>' +
                  '          <div class="editbarright" id="editbarright"><!-- --></div>      ' +
                  '          <div class="editbarinner" id="editbarinner">' +
                  '            <table border="0" cellspacing="0" cellpadding="0" class="editbartable" id="editbartable">' +
                  '              <tbody><tr class="tools">' +
                  '' +
                  '                <td><img height="24" width="2" src="/static/img/jun09/pad/editbar_groupleft.gif"></td>' +
                  '                <td class="editbarbutton editbargroupsfirst tool addEllipse" unselectable="on" dojoAttachEvent="onclick:_onAddEllipse"><img title="Add ellipse" src="/static/html/plugins/sketchSpace/imgeditbar_add_circle_icon.png"></td>' +
                  '                <td class="editbarbutton tool addPath" unselectable="on" dojoAttachEvent="onclick:_onAddPath"><img title="Add path" src="/static/html/plugins/sketchSpace/imgeditbar_add_line_icon.png"></td>' +
                  '                <td class="editbarbutton tool addPathFreehand" unselectable="on" dojoAttachEvent="onclick:_onAddPathFreehand"><img title="Add freehand path" src="/static/html/plugins/sketchSpace/imgeditbar_add_path_freehand_icon.png"></td>' +
                  '                <td class="editbarbutton tool addPathPolyline" unselectable="on" dojoAttachEvent="onclick:_onAddPathPolyline"><img title="Add polyline path" src="/static/html/plugins/sketchSpace/imgeditbar_add_path_polyline_icon.png"></td>' +
                  '                <td class="editbarbutton tool addRect" unselectable="on" dojoAttachEvent="onclick:_onAddRect"><img title="Add rectangle" src="/static/html/plugins/sketchSpace/imgeditbar_add_rect_icon.png"></td>' +
                  '                <td><img height="24" width="2" src="/static/img/jun09/pad/editbar_groupright.gif"></td>' +
                  '' +
                  '                <td width="100%">&nbsp;</td>' +
                  '' +
                  '              </tr></tbody>' +
                  '            </table>' +
                  '            <table border="0" cellspacing="0" cellpadding="0" class="editbarsavetable" id="editbarsavetable">' +
                  '              <tbody><tr>' +
                  '' +
                  '                <td><img height="24" width="2" src="/static/img/jun09/pad/editbar_groupleft.gif"></td>' +
                  '                <td class="editbarbutton editbargroupsfirst tool select" unselectable="on" dojoAttachEvent="onclick:_onSelect"><img title="Select objects" src="/static/html/plugins/sketchSpace/imgeditbar_select_icon.png"></td>' +
                  '                <td class="editbarbutton tool pan" unselectable="on" dojoAttachEvent="onclick:_onPan"><img title="Pan" src="/static/html/plugins/sketchSpace/imgeditbar_pan_icon.png"></td>' +
                  '                <td class="editbarbutton tool zoomIn" unselectable="on" dojoAttachEvent="onclick:_onZoomIn"><img title="Zoom in" src="/static/html/plugins/sketchSpace/imgeditbar_zoom_in_icon.png"></td>' +
                  '                <td class="editbarbutton" unselectable="on" dojoAttachEvent="onclick:_onZoomDefault"><img title="Zoom to default" src="/static/html/plugins/sketchSpace/imgeditbar_zoom_default_icon.png"></td>' +
                  '                <td class="editbarbutton tool zoomOut" unselectable="on" dojoAttachEvent="onclick:_onZoomOut"><img title="Zoom out" src="/static/html/plugins/sketchSpace/imgeditbar_zoom_out_icon.png"></td>' +
                  '                <td><img height="24" width="2" src="/static/img/jun09/pad/editbar_groupright.gif"></td>' +
                  '' +
//                '                <td>&nbsp;</td>' +
                  '' +
                  '              </tr></tbody>' +
                  '            </table>' +
                  '          </div>' +
                  '        </div>' +
                  '      </div>' +
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
