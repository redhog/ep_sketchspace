dojo.provide("sketchSpaceDesigner.designer.modes.Zoom");

dojo.require("sketchSpaceDesigner.designer.modes.Mode");

dojo.declare("sketchSpaceDesigner.designer.modes.Zoom", [sketchSpaceDesigner.designer.modes.Mode], {
  zoomFactor: 0.15,

  enable: function () {
    this.inherited(arguments);
    var mode = this;
  },
  disable: function () {
    this.inherited(arguments);
  },
  onMouseWheel: function (event, scroll) {
    this.inherited(arguments);
    if (scroll < 0)
      scroll = 1.0 / (1.0 + this.zoomFactor);
    else
      scroll = 1.0 + this.zoomFactor;
    var p = this.getCurrentGlobalMouse(event);
    this.onZoom(scroll, p.x, p.y);
  },
  onKeyUp: function (event) {
    this.inherited(arguments);
    if (event.keyCode == dojo.keys.UP_ARROW && event.ctrlKey && !event.altKey && !event.shiftKey) {
      this.onZoom(1.0 + this.zoomFactor);
    } else if (event.keyCode == dojo.keys.DOWN_ARROW && event.ctrlKey && !event.altKey && !event.shiftKey) {
      this.onZoom(1.0 / (1.0 + this.zoomFactor));
    }
  },
  onMouseDown: function(event) {
    this.inherited(arguments);
    this.designer.surface_transform.originalMatrix = this.designer.surface_transform.getTransform();
    this.orig = this.getCurrentMouse(event, this.designer.surface);
  },
  onMouseMove: function(event) {
    this.inherited(arguments);
    var mouse = this.inputState.mouse;
    var key = this.inputState.keyboard;
    if (   (    mouse[dojo.mouseButtons.MIDDLE] != undefined
            && !mouse[dojo.mouseButtons.MIDDLE].ctrlKey
	    && !mouse[dojo.mouseButtons.MIDDLE].altKey
            && !mouse[dojo.mouseButtons.MIDDLE].shiftKey)
	|| (    key[dojo.keys.SPACE] != undefined
	    &&  mouse[dojo.mouseButtons.LEFT] != undefined
            && !mouse[dojo.mouseButtons.LEFT].ctrlKey
	    && !mouse[dojo.mouseButtons.LEFT].altKey
            && !mouse[dojo.mouseButtons.LEFT].shiftKey
            && !key[dojo.keys.SPACE].ctrlKey
	    && !key[dojo.keys.SPACE].altKey
	    && !key[dojo.keys.SPACE].shiftKey)) {
       var mouseDown = mouse[dojo.mouseButtons.MIDDLE] || mouse[dojo.mouseButtons.LEFT];
       var move = this.getCurrentMove(event, this.designer.surface);
       this.designer.surface_transform.setTransform(dojox.gfx.matrix.multiply(move, this.designer.surface_transform.originalMatrix));
    }
  },
  onZoom: function (zoom, x, y) {
    if (x === undefined) x = this.designer.surface_size.width / 2;
    if (y === undefined) y = this.designer.surface_size.height / 2;

    var screenToCurrentZoomMatrix = dojox.gfx.matrix.invert(this.designer.surface_transform._getRealMatrix());

    var mouse = dojox.gfx.matrix.multiplyPoint(screenToCurrentZoomMatrix, x, y);
    this.designer.surface_transform.applyTransform(dojox.gfx.matrix.scaleAt(zoom, zoom, mouse.x, mouse.y));
  }
});
