dojo.provide("sketchSpaceDesigner.designer.modes.Mode");

dojo.require("dojox.gfx.matrix");
dojo.require("dijit.layout.ContentPane");
dojo.require("sketchSpaceDesigner.designer.widgets");
dojo.require("sketchSpaceDesigner.designer.outline");

dojo.declare("sketchSpaceDesigner.designer.modes.Mode", [], {
  constructor: function () {
    this.inputState = {};
    this.inputState.keyboard = {};
    this.inputState.mouse = {};
    this.outlines = {};
  },
  enable: function () {
    var mode = this;
    this.designer.forEachObjectShape(function (shape) { mode.enableShape(shape); });
    this.onMouseWheelHandle = dojo.connect(this.designer.container, (!dojo.isMozilla ? "onmousewheel" : "DOMMouseScroll"), function(e){
      var scroll = e[(!dojo.isMozilla ? "wheelDelta" : "detail")] * (!dojo.isMozilla ? 1 : -1);
      mode.onMouseWheel(e, scroll);
    });
    this.onKeyDownHandle = dojo.connect(document, "onkeydown", this, function (event) { mode.onKeyDown(event); });
    this.onKeyUpHandle = dojo.connect(document, "onkeyup", this, function (event) { mode.onKeyUp(event); });
    this.onMouseDownHandle = dojo.connect(this.designer.container, "onmousedown", this, this.onMouseDown);
    this.onMouseUpHandle = dojo.connect(this.designer.container, "onmouseup", this, this.onMouseUp);
    this.onMouseMoveHandle = dojo.connect(this.designer.container, "onmousemove", this, this.onMouseMove);
    this.onActivateHandle = dojo.connect(this.designer.container, "activate", this, this.onActivate);
    this.onContextMenuHandle = dojo.connect(this.designer.container, "contextmenu", this, this.onContextMenu);
    this.setOptionsHandle = dojo.connect(this.designer, "setOptions", this, this.onSetOptions);

/*
    this.shareCurrentImageOption = new sketchSpaceDesigner.designer.widgets.OptionCheckBox({title:"Shared image selection:", optionsPath:"shareCurrentImage", designer:this.designer});
    this.designer.ui.options.addChild(this.shareCurrentImageOption);

    this.showAuthorshipColorOption = new sketchSpaceDesigner.designer.widgets.OptionCheckBox({title:"Show authorship:", optionsPath:"showAuthorshipColors", designer:this.designer});
    this.designer.ui.options.addChild(this.showAuthorshipColorOption);
*/

    this.designer.ui.options.layout();
  },
  disable: function () {
    var mode = this;
    dojo.disconnect(this.setOptionsHandle);
    dojo.disconnect(this.onContextMenuHandle);
    dojo.disconnect(this.onActivateHandle);
    dojo.disconnect(this.onMouseDownHandle);
    dojo.disconnect(this.onMouseUpHandle);
    dojo.disconnect(this.onMouseMoveHandle);
    dojo.disconnect(this.onKeyUpHandle);
    dojo.disconnect(this.onKeyDownHandle);
    dojo.disconnect(this.onMouseWheelHandle);
    this.designer.forEachObjectShape(function (shape) { mode.disableShape(shape); });
/*
    this.shareCurrentImageOption.destroyRecursive();
    this.showAuthorshipColorOption.destroyRecursive();
*/
    this.designer.ui.options.layout();
    for (var name in this.outlines)
      this.disableOutline(name);
  },
  enableShape: function (shape) {
    var mode = this;
    shape.onMouseUpHandle = shape.connect("onmouseup", shape, function (event) { mode.onShapeMouseUp(shape, event); });
    shape.onMouseDownHandle = shape.connect("onmousedown", shape, function (event) { mode.onShapeMouseDown(shape, event); });
  },
  disableShape: function (shape) {
    dojo.disconnect(shape.onMouseUpHandle);
    dojo.disconnect(shape.onMouseDownHandle);
  },
  onActivate: function  (event) { dojo.stopEvent(event); },
  onContextMenu: function  (event) { dojo.stopEvent(event); },
  onSetOptions: function () {},
  onMouseWheel: function (event, scroll) {
  },
  onKeyDown: function (event) {
    this.inputState.keyboard[event.keyCode] = event;
  },
  onKeyUp: function (event) {
    console.log([event.keyCode, event]);
    if (event.keyCode == dojo.keys.CHAR_S) {
      this.designer.setOptions({doStroke: !this.designer.options.doStroke});
    } else if (event.keyCode == dojo.keys.CHAR_F) {
      this.designer.setOptions({doFill: !this.designer.options.doFill});
    } else if (event.keyCode == dojo.keys.ESCAPE) {
     // FIXME: Kind of ugly, but needed to set the corect mode icon in
     // the UI. Maybe change UI code to use dojo.connect for that?
     this.designer.ui._onSelect();
    }
    delete this.inputState.keyboard[event.keyCode];
  },
  onMouseDown: function(event) {
    this.inputState.mouse[event.button] = event;
  },
  onMouseUp: function(event) {
    delete this.inputState.mouse[event.button];
  },
  onMouseMove: function(event) {
    this.mouse = this.getCurrentGlobalMouse(event);
    this.updateCursorBboxOutline();
  },
  onShapeMouseDown: function (shape, event) {
  },
  onShapeMouseUp: function (shape, event) {
  },

  screenToLocalCoord: function (p, container) {
    if (container === undefined) container = this.getContainerShape();
    var screenToObjMatrix = dojox.gfx.matrix.invert(container._getRealMatrix());
    return dojox.gfx.matrix.multiplyPoint(screenToObjMatrix, p.x, p.y);
  },

  localCoordToScreen: function (p, container) {
    if (container === undefined) container = this.getContainerShape();
    var objToScreenMatrix = container._getRealMatrix();
    return dojox.gfx.matrix.multiplyPoint(objToScreenMatrix, p.x, p.y);
  },

  getCurrentGlobalMouse: function (event) {
    if (event.layerX !== undefined && !$.browser.msie) {
      return {x:event.layerX, y:event.layerY};
    } else {
      /* All of this is for Opera, that Dojo does not seem to handle
       * correctly... Hopefully it doesn't break other browsers... */
      var cpos = $(this.designer.container).offset();
      var tpos = $(event.target).offset();
      return {x: event.offsetX + tpos.left - cpos.left, y: event.offsetY + tpos.top - cpos.top};
    }
  },

  getCurrentMouse: function (event, container) {
   return this.screenToLocalCoord(this.getCurrentGlobalMouse(event), container);
  },

  getCurrentMove: function (event, container, orig) {
    var mouse = this.getCurrentMouse(event, container);
    if (orig === undefined) orig = this.orig;
    return dojox.gfx.matrix.translate(mouse.x - orig.x, mouse.y - orig.y);
  },

  getCurrentCursorBbox: function() {
    return sketchSpaceDesigner.designer.bbox.Bbox().addPoints([this.orig, this.mouse]);
  },

  addOutline: function(name, bbox, lineDefinitions) {
    if (this.outlines[name] !== undefined) return;
    this.outlines[name] = sketchSpaceDesigner.designer.outline.createOutline(this.designer, bbox, lineDefinitions);
    return this.outlines[name];
  },

  removeOutline: function (name) {
    if (this.outlines[name] !== undefined) {
      this.outlines[name].removeShape();
      delete this.outlines[name];
    }
  },

  addCursorBboxOutline: function(name) {
    this.addOutline("cursorBboxOutline", this.getCurrentCursorBbox(), this.cursorBboxOutlineDefinitions[name]);
  },

  updateCursorBboxOutline: function () {
    if (this.outlines.cursorBboxOutline == undefined) return;
    this.outlines.cursorBboxOutline.bbox = this.getCurrentCursorBbox();
    var n = this.outlines.cursorBboxOutline.bbox;
    this.outlines.cursorBboxOutline.update();
  },

  removeCursorBboxOutline: function () {
    this.removeOutline("cursorBboxOutline");
  }

});
