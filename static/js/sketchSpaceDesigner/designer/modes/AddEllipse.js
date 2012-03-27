dojo.provide("sketchSpaceDesigner.designer.modes.AddEllipse");

dojo.require("sketchSpaceDesigner.designer.modes.Edit");

dojo.declare("sketchSpaceDesigner.designer.modes.AddEllipse", [sketchSpaceDesigner.designer.modes.Edit], {
  enable: function () {
    this.inherited(arguments);
    this.shape = undefined;
    this.isStraightOption = new sketchSpaceDesigner.designer.widgets.OptionCheckBox({title:"Straighten [SHIFT]:", optionsPath:"isStraight", designer:this.designer});
    this.designer.ui.options.addChild(this.isStraightOption);
    this.designer.ui.options.layout();
  },
  disable: function () {
    this.inherited(arguments);
    if (this.shape !== undefined) {
      this.shape.removeShape();
    }
    this.isStraightOption.destroyRecursive();
    this.designer.ui.options.layout();
  },
  getContainerShape: function () { return this.designer.surface_transform; },
  onSetOptions: function () {
    if (this.shape !== undefined) {
      this.designer.setShapeFillAndStroke(this.shape, this.designer.options);
      this.updateShape();
    }
  },
  onKeyDown: function (event) {
    this.inherited(arguments);
    if (event.keyCode == dojo.keys.SHIFT) {
      this.designer.setOptions({isStraight: true});
    }
  },
  onKeyUp: function (event) {
    this.inherited(arguments);
    if (event.keyCode == dojo.keys.SHIFT) {
      this.designer.setOptions({isStraight: false});
    }
  },
  onMouseDown: function (event) {
    this.inherited(arguments);
    if (event.button == dojo.mouseButtons.LEFT) {
      this.mouse = this.orig = this.getCurrentMouse(event);
      this.shape = dojox.gfx.utils.deserialize(this.getContainerShape(), {shape:{type:"ellipse", cx:this.orig.x, cy:this.orig.y, rx:1, ry:1}});
      this.onSetOptions();
    }
  },
  onMouseUp: function (event) {
    this.inherited(arguments);
    if (this.shape !== undefined) {
      this.designer.registerObjectShape(this.shape);
      this.designer.saveShapeToStr(this.shape);
      this.designer.imageUpdated();
      this.shape = undefined;
    }
  },
  onMouseMove: function (event) {
    this.inherited(arguments);
    if (this.shape !== undefined) {
      this.mouse = this.getCurrentMouse(event);
      this.updateShape();
    }
  },
  updateShape: function () {
    var shapeData = this.shape.getShape();

    if (this.designer.options.isStraight) {
      shapeData.ry = shapeData.rx = Math.pow(Math.pow(Math.abs(this.mouse.x - this.orig.x), 2) + Math.pow(Math.abs(this.mouse.y - this.orig.y), 2), 1/2);
    } else {
      shapeData.rx = Math.abs(this.mouse.x - this.orig.x);
      shapeData.ry = Math.abs(this.mouse.y - this.orig.y);
    }

    this.shape.setShape(shapeData);
  }
});
