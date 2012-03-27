dojo.provide("sketchSpaceDesigner.designer.modes.ZoomPlus");

dojo.require("sketchSpaceDesigner.designer.modes.Zoom");
dojo.require("sketchSpaceDesigner.designer.bbox");

dojo.declare("sketchSpaceDesigner.designer.modes.ZoomPlus", [sketchSpaceDesigner.designer.modes.Zoom], {
  minMarqueeSize: 10,

  constructor: function (zoomIn) {
    this.inherited(arguments, []);
    this.initialZoomIn = zoomIn;
  },

  cursorBboxOutlineDefinitions: {zoom: [{color:{r:128,g:128,b:128,a:1},width:1, style:"solid"}, {color:{r:196,g:196,b:196,a:1},width:1, style:"solid"}]},

  enable: function () {
    this.inherited(arguments);
    // Set some defaults
    this.designer.setOptions({zoomIn: true}, true);
    if (this.initialZoomIn !== undefined)
      this.designer.setOptions({zoomIn: this.initialZoomIn});
    this.initialZoomIn = undefined;
    this.zoomInOption = new sketchSpaceDesigner.designer.widgets.OptionCheckBox({title:"Zoom in [SHIFT]:", optionsPath:"zoomIn", designer:this.designer});
    this.designer.ui.options.addChild(this.zoomInOption);
    this.designer.ui.options.layout();
  },

  disable: function () {
    this.inherited(arguments);
    this.zoomInOption.destroyRecursive();
    this.designer.ui.options.layout();
    $(this.designer.container).css({'cursor': 'default'});
  },

  onSetOptions: function (options) {
    var cur = this.designer.options.zoomIn ? 'imgeditbar_zoom_in_icon.png' : 'imgeditbar_zoom_out_icon.png';
    $(this.designer.container).css({'cursor': 'url(/static/html/plugins/sketchSpace/' + cur + '),default'});
  },

  onKeyDown: function (event) {
    this.inherited(arguments);
    if (event.keyCode == dojo.keys.SHIFT) {
      this.designer.setOptions({zoomIn: !this.designer.options.zoomIn});
    }
  },

  onKeyUp: function (event) {
    this.inherited(arguments);
    if (event.keyCode == dojo.keys.SHIFT) {
      this.designer.setOptions({zoomIn: !this.designer.options.zoomIn});
    }
  },

  onMouseDown: function (event) {
    this.inherited(arguments);
    if (event.button == dojo.mouseButtons.LEFT) {
      this.orig = this.mouse = this.getCurrentGlobalMouse(event);
      this.addCursorBboxOutline("zoom");
    }
  },

  onMouseUp: function (event) {
    this.inherited(arguments);
    if (event.button == dojo.mouseButtons.LEFT) {
      this.removeCursorBboxOutline("zoom");
      var bbox = this.getCurrentCursorBbox();
      if (bbox.width < this.minMarqueeSize && bbox.height < this.minMarqueeSize) {
        if (this.designer.options.zoomIn)
 	  this.onZoom(1.0 + this.zoomFactor, this.orig.x, this.orig.y);
	else
	  this.onZoom(1.0 / (1.0 + this.zoomFactor), this.orig.x, this.orig.y);
      } else {
	var originalMatrix = this.designer.surface_transform._getRealMatrix();

        var hScale = this.designer.surface_size.width / bbox.width;
        var vScale = this.designer.surface_size.height / bbox.height;

        this.designer.surface_transform.setTransform(dojox.gfx.matrix.multiply(dojox.gfx.matrix.scale(Math.min(hScale, vScale)), dojox.gfx.matrix.translate(-bbox.x, -bbox.y), originalMatrix));
      }
    }
  }
});
