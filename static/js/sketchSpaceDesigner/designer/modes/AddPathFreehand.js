dojo.provide("sketchSpaceDesigner.designer.modes.AddPathFreehand");

dojo.require("sketchSpaceDesigner.designer.modes.EditPath");
dojo.require("sketchSpaceDesigner.utils");



dojo.declare("sketchSpaceDesigner.designer.modes.AddPathFreehand.Path", [sketchSpaceDesigner.designer.modes.EditPath.prototype.Path], {
  setOptions: function (options) {
   this.inherited(arguments,
		  [sketchSpaceDesigner.utils.setObject({
		     isClosed: false,
		     isLine: false,
		     isStraight: false
		   }, options, true)]);
  }
});

dojo.declare("sketchSpaceDesigner.designer.modes.AddPathFreehand", [sketchSpaceDesigner.designer.modes.EditPath], {
  Path: sketchSpaceDesigner.designer.modes.AddPathFreehand.Path,
  enable: function () {
    this.inherited(arguments);
    // Set some defaults
    this.designer.setOptions({smothenessFactor: 6}, true);
    this.smothenessFactorOption = new sketchSpaceDesigner.designer.widgets.OptionNumberSpinner({title:"Smoothness", optionsPath:"smothenessFactor", designer:this.designer, style:"width:30pt"});
    this.designer.ui.options.addChild(this.smothenessFactorOption);
    this.designer.ui.options.layout();

  },
  disable: function () {
    this.inherited(arguments);
    if (this.path !== undefined) {
      this.path.shape.removeShape();
    }
    this.smothenessFactorOption.destroyRecursive();
    this.designer.ui.options.layout();
  },
  onKeyUp: function (event) {
    this.inherited(arguments);
    if (event.keyCode == dojo.keys.UP_ARROW && !event.ctrlKey && !event.altKey && !event.shiftKey) {
      this.designer.setOptions({smothenessFactor: Math.max(4, this.designer.options.smothenessFactor + 3)});
    } else if (event.keyCode == dojo.keys.DOWN_ARROW && !event.ctrlKey && !event.altKey && !event.shiftKey) {
      this.designer.setOptions({smothenessFactor: Math.max(4, this.designer.options.smothenessFactor - 3)});
    }
  },
  onMouseDown: function (event) {
    this.inherited(arguments);
    if (event.button == dojo.mouseButtons.LEFT) {
      this.begin(this.getCurrentMouse(event));
    }
  },
  onMouseUp: function (event) {
    this.inherited(arguments);
    if (this.path !== undefined) {
      this.done()
    }
  },
  onMouseMove: function (event) {
    this.inherited(arguments);
    this.addPoint(this.getCurrentMouse(event));
  }
});