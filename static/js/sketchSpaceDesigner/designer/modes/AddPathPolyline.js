dojo.provide("sketchSpaceDesigner.designer.modes.AddPathPolyline");

dojo.require("sketchSpaceDesigner.designer.modes.EditPath");
dojo.require("sketchSpaceDesigner.utils");

dojo.declare("sketchSpaceDesigner.designer.modes.AddPathPolyline.Path", [sketchSpaceDesigner.designer.modes.EditPath.prototype.Path], {
  setOptions: function (options) {
    this.inherited(arguments,
		   [sketchSpaceDesigner.utils.setObject({
		     isLine: true
		   }, options, true)]);
  }
});

dojo.declare("sketchSpaceDesigner.designer.modes.AddPathPolyline", [sketchSpaceDesigner.designer.modes.EditPath], {
  CLOSE_CLICK_DISTANCE: 5,
  Path: sketchSpaceDesigner.designer.modes.AddPathPolyline.Path,
  enable: function () {
    this.inherited(arguments);
    // Set some defaults
    this.designer.setOptions({isStraight: false}, true);
    this.isStraightOption = new sketchSpaceDesigner.designer.widgets.OptionCheckBox({title:"Straighten [SHIFT]:", optionsPath:"isStraight", designer:this.designer});
    this.designer.ui.options.addChild(this.isStraightOption);
    this.designer.ui.options.layout();

  },
  disable: function () {
    this.inherited(arguments);
    if (this.path !== undefined) {
      this.path.shape.removeShape();
    }
    this.isStraightOption.destroyRecursive();
    this.designer.ui.options.layout();
  },
  onKeyDown: function (event) {
    this.inherited(arguments);
    if (event.keyCode == dojo.keys.SHIFT) {
      this.designer.setOptions({isStraight: !this.designer.options.isStraight});
    }
  },
  onKeyUp: function (event) {
    this.inherited(arguments);
    if (event.keyCode == dojo.keys.SHIFT) {
      this.designer.setOptions({isStraight: !this.designer.options.isStraight});
    }
  },
  onMouseDown: function (event) {
    var lastMouseDownPoint;
    var point;
    this.inherited(arguments);

    if (this.lastMouseDownEvent) {
      lastMouseDownPoint = this.getCurrentGlobalMouse(this.lastMouseDownEvent);
      point = this.getCurrentGlobalMouse(event);
    }

    if (   event.button == dojo.mouseButtons.RIGHT
	|| (   this.lastMouseDownEvent
	    && lastMouseDownPoint.x == point.x
	    && lastMouseDownPoint.y == point.y
	    && this.lastMouseDownEvent.button == dojo.mouseButtons.LEFT
            && event.button == dojo.mouseButtons.LEFT)) {

      if (   this.path.sections.length > 0
          && lastMouseDownPoint.x == point.x
	  && lastMouseDownPoint.y == point.y) {
        this.path.removeSection();
      }

      if (this.path.sections.length > 0) {
        var mouse = this.getCurrentGlobalMouse(event);
	var first = this.localCoordToScreen(this.path.sections[0].points[0]);
 
        if (Math.abs(first.x - mouse.x) <= this.CLOSE_CLICK_DISTANCE && Math.abs(first.y - mouse.y) <= this.CLOSE_CLICK_DISTANCE) {
	  this.path.removeSection();
	  this.designer.setOptions({isClosed: true});
        }
 
	this.done();
      }
    } else if (event.button == dojo.mouseButtons.LEFT) {
      if (this.path !== undefined) {
        this.beginSection(this.getCurrentMouse(event));
      } else {
        this.designer.setOptions({isClosed: false});
        this.begin(this.getCurrentMouse(event));
      }
    }
    this.lastMouseDownEvent = event;
  },
  onMouseMove: function (event) {
    this.inherited(arguments);
    this.addPoint(this.getCurrentMouse(event));
  },
  begin: function (position) {
    this.inherited(arguments)
    this.designer.setOptions({isClosed: false}, true);
  }
});
