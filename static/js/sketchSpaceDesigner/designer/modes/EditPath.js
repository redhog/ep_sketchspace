dojo.provide("sketchSpaceDesigner.designer.modes.EditPath");

dojo.require("sketchSpaceDesigner.designer.modes.Edit");
dojo.require("sketchSpaceDesigner.utils");


dojo.declare("sketchSpaceDesigner.designer.modes.EditPath.Path", [], {
  renderTimout: 100, // render stuff every x milliseconds. Only used by msie because if we render every time it crashes because it is sooo slooooow
  constructor: function (mode) {
    this.mode = mode;
    this.sections = [];
    this.options = {};
    this.shape = undefined;
    this.setOptions(mode.designer.options);
    this.lastRenderTime = 0;
  },
  setOptions: function (options) {
    sketchSpaceDesigner.utils.setObject(this.options, options);
    var section = this.getLastSection();
    if (section !== undefined)
      section.setOptions(options);
    this.renderToShape();
  },
  addSection: function () {
    this.sections.push(new this.mode.PathSection(this));
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
  renderToShape: function (force) {
    if ($.browser.msie) {
      var t = new Date().getTime();
      if (!force && t - this.lastRenderTime < this.renderTimout) return;
      this.lastRenderTime = t;
    }

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

dojo.declare("sketchSpaceDesigner.designer.modes.EditPath.PathSection", [], {
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
	  point = {x:point.x, y:prevPoint.y};
        } else {
 	  point = {x:prevPoint.x, y:point.y};
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

dojo.declare("sketchSpaceDesigner.designer.modes.EditPath", [sketchSpaceDesigner.designer.modes.Edit], {
  Path: sketchSpaceDesigner.designer.modes.EditPath.Path,
  PathSection: sketchSpaceDesigner.designer.modes.EditPath.PathSection,
  disable: function () {
    this.inherited(arguments);
    if (this.path !== undefined) {
      this.path.shape.removeShape();
    }
  },
  onKeyUp: function (event) {
    this.inherited(arguments);
    if (event.keyCode == dojo.keys.ENTER && !event.ctrlKey && !event.altKey && !event.shiftKey) {
      this.done();
    }
  },
  onSetOptions: function () {
    if (this.path === undefined) return;
    this.path.setOptions(this.designer.options);
  },
  addPoint: function (position) {
    if (this.path === undefined) return;
    this.path.addPoint(position);
  },
  begin: function (position) {
    if (this.path !== undefined) return;
    this.path = new this.Path(this);
    this.beginSection(position);
  },
  beginSection: function (position) {
    if (this.path === undefined) return;
    this.path.addSection();
    this.path.addPoint(position);
  },
  done: function () {
    this.path.renderToShape(true);
    if (this.path === undefined) return;
    if (this.path.sections.length > 0) {
      this.designer.registerObjectShape(this.path.shape);
      this.designer.saveShapeToStr(this.path.shape);
      this.designer.imageUpdated();
    } else {
      this.path.shape.removeShape();
    }
    this.path = undefined;
  }
});
