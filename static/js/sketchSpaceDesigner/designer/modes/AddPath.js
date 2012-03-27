dojo.provide("sketchSpaceDesigner.designer.modes.AddPath");

dojo.require("sketchSpaceDesigner.designer.modes.Edit");
dojo.require("sketchSpaceDesigner.utils");

dojo.declare("sketchSpaceDesigner.designer.modes.Path", [], {
  constructor: function (mode) {
    this.mode = mode;
    this.sections = [];
    this.options = {};
    this.shape = undefined;
    this.setOptions(mode.designer.options);
  },
  setOptions: function (options) {
    sketchSpaceDesigner.utils.setObject(this.options, options);
    var section = this.getLastSection();
    if (section !== undefined)
      section.setOptions(options);
    this.renderToShape();
  },
  addSection: function () {
    this.sections.push(new sketchSpaceDesigner.designer.modes.PathSection(this));
    this.getLastSection().setOptions(this.options);
  },
  removeSection: function () {
    this.sections.pop();
    this.renderToShape();
  },
  getLastSection: function () {
    return this.sections[this.sections.length-1];
  },
  addPoint: function (p) {
    this.getLastSection().addPoint(p);
    this.renderToShape();
  },
  renderToShape: function () {
    if (this.sections.length > 0 && this.sections[0].points.length > 0) {
      // Note: We can't set path empty here and use shape.moveTo() because then Chrome woulod freak out...
      var path = "M " + this.sections[0].points[0].x + "," + this.sections[0].points[0].y;
      if (this.shape === undefined)
        this.shape = dojox.gfx.utils.deserialize(this.mode.getContainerShape(), {shape:{type:"path", path:path}});
      else
        this.shape.setShape({path:path});

      this.mode.designer.setShapeFillAndStroke(this.shape, this.options);
      this.shape.setAbsoluteMode(true);

      this.shape.lastPoint = this.sections[0].points[0];
      dojo.forEach(this.sections, function(section, i) {
	section.renderToShape();
      });

      if (this.options.isClosed) {
	this.shape.closePath();
      }
    }
  }
});

dojo.declare("sketchSpaceDesigner.designer.modes.PathSection", [], {
  constructor: function (path) {
    this.path = path;
    this.options = {};
    this.setOptions(this.path.options);
    this.points = [];
  },
  setOptions: function (options) {
    sketchSpaceDesigner.utils.setObject(this.options, options);
  },
  addPoint: function (p) {
    this.points.push(p);
  },
  renderToShape: function () {
    if (this.points.length == 0) return;
    var point;
    var prevPoint;

    var halfStep = Math.max(1, Math.floor(this.options.smothenessFactor / 2));

    if (this.options.isLine) {
      point = this.points[this.points.length - 1];

      if (this.options.isStraight) {
        prevPoint = this.path.shape.lastPoint;
        if (Math.abs(point.x - prevPoint.x) > Math.abs(point.y - prevPoint.y)) {
 	  point.y = prevPoint.y;
        } else {
 	  point.x = prevPoint.x;
        }
        this.path.shape.lineTo(point.x, point.y);
        this.path.shape.lastPoint = point;
      } else {
        this.path.shape.lineTo(point.x, point.y);
        this.path.shape.lastPoint = point;
      }
    } else {
      var i;
 
      for (i = this.options.smothenessFactor; i < this.points.length; i += this.options.smothenessFactor) {
	point = this.points[i];
	prevPoint = this.points[i - halfStep];
	this.path.shape.smoothCurveTo(prevPoint.x, prevPoint.y, point.x, point.y);
      }

      if (this.options.isClosed) {
        point = this.points[0];
      } else {
        point = this.points[this.points.length - 1];
      }
      prevPoint = this.points[Math.min(i - halfStep, this.points.length - 1)];

      this.path.shape.smoothCurveTo(prevPoint.x, prevPoint.y, point.x, point.y);
      this.path.shape.lastPoint = point;
    }
  }
});

dojo.declare("sketchSpaceDesigner.designer.modes.AddPath", [sketchSpaceDesigner.designer.modes.Edit], {
  enable: function () {
    this.inherited(arguments);
    // Set some defaults
    this.designer.setOptions({smothenessFactor: 6, isClosed: false, isLine: false, isStraight:false}, true);
    this.smothenessFactorOption = new sketchSpaceDesigner.designer.widgets.OptionNumberSpinner({title:"Smoothness", optionsPath:"smothenessFactor", designer:this.designer, style:"width:30pt"});
    this.designer.ui.options.addChild(this.smothenessFactorOption);
    this.isClosedOption = new sketchSpaceDesigner.designer.widgets.OptionCheckBox({title:"Close loop [c] [ALT]:", optionsPath:"isClosed", designer:this.designer});
    this.designer.ui.options.addChild(this.isClosedOption);
    this.isLineOption = new sketchSpaceDesigner.designer.widgets.OptionCheckBox({title:"Lines [l] [CTRL]:", optionsPath:"isLine", designer:this.designer});
    this.designer.ui.options.addChild(this.isLineOption);
    this.isStraightOption = new sketchSpaceDesigner.designer.widgets.OptionCheckBox({title:"Straighten [SHIFT]:", optionsPath:"isStraight", designer:this.designer});
    this.designer.ui.options.addChild(this.isStraightOption);
    this.designer.ui.options.layout();

  },
  disable: function () {
    this.inherited(arguments);
    if (this.path !== undefined) {
      this.path.shape.removeShape();
    }
    this.smothenessFactorOption.destroyRecursive();
    this.isClosedOption.destroyRecursive();
    this.isLineOption.destroyRecursive();
    this.isStraightOption.destroyRecursive();
    this.designer.ui.options.layout();
  },
  getContainerShape: function () { return this.designer.surface_transform; },
  onKeyDown: function (event) {
    this.inherited(arguments);
    if (event.keyCode == dojo.keys.SHIFT) {
      this.designer.setOptions({isStraight: true});
    } else if (event.keyCode == dojo.keys.CTRL) {
      this.designer.setOptions({isLine: true});
    } else if (event.keyCode == dojo.keys.ALT) {
      this.designer.setOptions({isClosed: true});
    }
  },
  onKeyUp: function (event) {
    this.inherited(arguments);
    if (event.keyCode == dojo.keys.UP_ARROW && !event.ctrlKey && !event.altKey && !event.shiftKey) {
      this.designer.setOptions({smothenessFactor: Math.max(4, this.designer.options.smothenessFactor + 3)});
    } else if (event.keyCode == dojo.keys.DOWN_ARROW && !event.ctrlKey && !event.altKey && !event.shiftKey) {
      this.designer.setOptions({smothenessFactor: Math.max(4, this.designer.options.smothenessFactor - 3)});
    } else if (event.keyCode == dojo.keys.CHAR_C && !event.ctrlKey && !event.altKey && !event.shiftKey) {
      this.designer.setOptions({isClosed: !this.designer.options.isClosed});
    } else if (event.keyCode == dojo.keys.CHAR_L && !event.ctrlKey && !event.altKey && !event.shiftKey) {
      this.designer.setOptions({isLine: !this.designer.options.isLine});
    } else if (event.keyCode == dojo.keys.SHIFT) {
      this.designer.setOptions({isStraight: false});
    } else if (event.keyCode == dojo.keys.CTRL) {
      this.designer.setOptions({isLine: false});
    } else if (event.keyCode == dojo.keys.ALT) {
      this.designer.setOptions({isClosed: false});
    } else if (event.keyCode == dojo.keys.ENTER && !event.ctrlKey && !event.altKey && !event.shiftKey) {
      this.done();
    }
  },
  onSetOptions: function () {
    if (this.path !== undefined)
      this.path.setOptions(this.designer.options);
  },
  onMouseDown: function (event) {
    this.inherited(arguments);
    if (event.button == dojo.mouseButtons.LEFT) {
      if (this.path === undefined) {
        this.path = new sketchSpaceDesigner.designer.modes.Path(this);
        this.path.addSection();
        this.path.addPoint(this.getCurrentMouse(event));
      }
    }
  },
  onMouseUp: function (event) {
    this.inherited(arguments);
    if (this.path !== undefined) {
      if (event.button == dojo.mouseButtons.RIGHT) {
        this.path.removeSection();
        this.done()
      } else {
        this.path.addSection();
        this.path.addPoint(this.getCurrentMouse(event));
      }
    }
  },
  onMouseMove: function (event) {
    this.inherited(arguments);
    if (this.path !== undefined) {
      this.path.addPoint(this.getCurrentMouse(event));
    }
  },
  done: function () {
    if (this.path !== undefined) {
      if (this.path.sections.length > 0) {
        this.designer.registerObjectShape(this.path.shape);
        this.designer.saveShapeToStr(this.path.shape);
        this.designer.imageUpdated();
      } else {
        this.path.shape.removeShape();
      }
      this.path = undefined;
    }
  }
});
