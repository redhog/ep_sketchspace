(function () {
  var hooks = require("ep_etherpad-lite/static/js/pluginfw/hooks");

  dojo.provide("sketchSpaceDesigner.designer.editor");

  dojo.require("sketchSpaceDesigner.utils");
  dojo.require("sketchSpaceDesigner.designer.modes");
  dojo.require("sketchSpaceDesigner.designer.bbox");
  dojo.require("sketchSpaceDesigner.designer.selection");
  dojo.require("sketchSpaceDesigner.designer.widgets");
  dojo.require("dojox.gfx");
  dojo.require("dojox.gfx.move");
  dojo.require("dojox.gfx.utils");
  dojo.require("dojox.gfx.matrix");
  dojo.require("dojox.uuid.generateRandomUuid");
  dojo.require("dojo.parser");
  dojo.require("dojox.layout.TableContainer");
  dojo.require("dijit.layout.ContentPane");

  dojo.declare("sketchSpaceDesigner.designer.editor.Editor", [], {
   constructor: function (container, userId, ui, viewOnly) {
      this.container = container;

      this.userId = userId;
      this.ui = ui;

      this.surface = dojox.gfx.createSurface(this.container, 1, 1);
      this.resize();
      this.surface_transform = this.surface.createGroup();

      this.viewUpdatedHandle = dojo.connect(this.surface_transform, "setTransform", this, function () { this.viewUpdated(); });

      this.images = {};
      this.currentImage = undefined;
      this.currentSharedImage = undefined;
      this.selection = new sketchSpaceDesigner.designer.selection.Selection(this);

      dojo.connect(this.container, "ondragstart",   dojo, "stopEvent");
      dojo.connect(this.container, "onselectstart", dojo, "stopEvent");

      this.options = {};
      this.setOptions({
        doStroke: true,
        doFill: false,
        stroke: {"type":"stroke","color":{"r":0,"g":255,"b":0,"a":1},"style":"solid","width":2,"cap":"butt","join":4},
        fill: {"r":255,"g":0,"b":0,"a":1},
        showAuthorshipColors: true,
        shareCurrentImage: true
      });

      this.modeStack = [];
      if (viewOnly)
        this.pushMode(new sketchSpaceDesigner.designer.modes.Zoom());
      else
        this.pushMode(new sketchSpaceDesigner.designer.modes.Select());

      dojo.connect(container.window, "onresize", this, "resize");
    },

    resize: function () {
      /* IE + dojo workaround */
      $(this.container).removeAttr("style");

      this.surface_size = {width: $(this.container).width(), height: $(this.container).height()};
      this.surface.setDimensions(this.surface_size.width, this.surface_size.height);
      return $(this.container).width() > 1 && $(this.container).height() > 1;
    },

    setOptions: function (options, onlyDefault) {
      sketchSpaceDesigner.utils.setObject(this.options, options, onlyDefault);
      this.updateAuthorshipColor();
      this.selectSharedImage();
    },

    setOptionsByPath: function (options) {
      this.setOptions(sketchSpaceDesigner.utils.objectFromPaths(options));
    },

    getOptionByPath: function (path) {
      return sketchSpaceDesigner.utils.getObjectByPath(this.options, path);
    },

    pushMode: function (mode) {
      if (this.modeStack.length > 0)
        this.getCurrentMode().disable();
      mode.designer = this;
      this.modeStack.push(mode);
      this.getCurrentMode().enable();
    },

    popMode: function () {
      this.getCurrentMode().disable();
      this.modeStack.pop();
      if (this.modeStack.length > 0)
        this.getCurrentMode().enable();
    },

    setMode: function (mode) {
      if (this.modeStack.length > 0)
        this.getCurrentMode().disable();
      this.modeStack = [];
      mode.designer = this;
      this.modeStack.push(mode);
      this.getCurrentMode().enable();
    },

    getCurrentMode: function () {
      return this.modeStack[this.modeStack.length - 1];
    },

    /* This function should really be somewhere else... */
    getUserColor: function (userId) {
      var palette;
      var userData;

      if (typeof(pad) == "undefined") {
        palette = clientVars.colorPalette;
        userData = clientVars.historicalAuthorData[userId];
      } else {
        palette = pad.getColorPalette();

        $.each(pad.collabClient.getConnectedUsers(), function () {
          if (this.userId == userId)
            userData = this;
        });

        if (userData === undefined) {
          userData = clientVars.collab_client_vars.historicalAuthorData[userId];
        }
      }

      if (userData === undefined) {
        return;
      }

      return palette[userData.colorId]
    },

    deserializeShape: function(parent, description) {
      var shape;
      if (description.extType) {
        var shapes = hooks.callFirst("sketchspaceDeserializeShape_" + description.extType, {designer: this, parent:parent, description:description});
        if (shapes.length) {
          shape = shapes[0];
        } else {
          // Fixme: Can we store the size somewhere?
          placeholder = {"shape": {"type":"rect","x":0,"y":0,"width":100,"height":100,"r":0},
                         "stroke":{"type":"stroke","color":{"r":255,"g":127,"b":127,"a":1},"style":"solid","width":2,"cap":"butt","join":4},
                         "fill":{"r":255,"g":0,"b":0,"a":1}}
          
          shape = dojox.gfx.utils.deserialize(parent, placeholder);
          if (description.transform) {
            shape.setTransform(description.transform);
          }
          shape.extType = description.extType;
          shape.strRepr = dojo.toJson({shape:description});
        }
      } else {
        shape = dojox.gfx.utils.deserialize(parent, description);
      }

      shape.userId = description.userId;
      shape.realColor = {fill: shape.getFill(),
                         stroke: shape.getStroke()};

      this.updateShapeAuthorshipColor(shape);

      return shape;
    },

    serializeShape: function(shape) {
      /* FIXME: Remove "children" from serialized groups */

      var description;

      if (shape.extType) {
        var descriptions = hooks.callFirst("sketchspaceSerializeShape_" + shape.extType, {shape:shape});
        if (descriptions.length) {
          description = descriptions[0];
        } else {
          description = dojo.fromJson(shape.strRepr).shape
          if (description.transform) {
            description.transform = shape.getTransform();
          }
        }
      } else {
        description = dojox.gfx.utils.serialize(shape);
      }

      description.fill = shape.realColor.fill;
      description.stroke = shape.realColor.stroke;

      description.userId = shape.userId;
      return description;
    },

    saveShapeToStr: function(shape) {
      var parent = null;
      if (shape.parent.objId != undefined)
        parent = shape.parent.objId;
      shape.userId = this.userId;
      shape.strRepr = dojo.toJson({parent:parent, shape:this.serializeShape(shape), userId:shape.userId});
      this.imageUpdatedByUs();
    },

    updateShapeAuthorshipColor: function (shape) {
      if (shape.extType != undefined)
        return;
      if (this.options.showAuthorshipColors) {
        var userColor = dojox.color.fromHex(this.getUserColor(shape.userId || this.userId) || "#ff0000");

        shape.setFill(!shape.realColor.fill ? undefined : userColor);

        var stroke;
        if (shape.realColor.stroke) {
          stroke = {};
          sketchSpaceDesigner.utils.setObject(stroke, shape.realColor.stroke);
          var strokeColor = dojox.color.fromArray(userColor.toRgba());
          strokeColor.r = Math.round(strokeColor.r / 2);
          strokeColor.g = Math.round(strokeColor.g / 2);
          strokeColor.b = Math.round(strokeColor.b / 2);
          stroke.color = strokeColor;
        }
        shape.setStroke(stroke);
      } else {
        shape.setFill(shape.realColor.fill);
        shape.setStroke(shape.realColor.stroke);
      }
    },

    updateAuthorshipColor: function () {
      var designer = this;
      this.forEachObjectShape(function (shape) {
        designer.updateShapeAuthorshipColor(shape);
      });
    },

    setShapeFillAndStroke: function (shape, options) {
      shape.realColor = {fill: options.doFill ? options.fill : undefined, stroke: options.doStroke ? sketchSpaceDesigner.utils.setObject({}, options.stroke) : undefined};

      this.updateShapeAuthorshipColor(shape);
    },

    /* Use this to listen for changes */
    imageUpdatedByUs: function () { this.imageUpdated(); },
    imageUpdatedByOthers: function () { this.imageUpdated(); },

    imageUpdated: function () { this.viewUpdated(); },

    viewUpdated: function () { },

    selectImage: function (imageId) {
      this.currentImage = imageId;
    },

    deselectImage: function () {
      this.currentImage = undefined;
    },

    selectSharedImage: function (imageId) {
      if (imageId !== undefined)
        this.currentSharedImage = imageId;
      if (this.options.shareCurrentImage) {
        this.selectImage(this.currentSharedImage);
      }
    },

    deselectSharedImage: function () {
      this.currentSharedImage = undefined;
      if (this.options.shareCurrentImage) {
        this.deselectImage();
      }
    },

    editorGetShapeByObjId: function(objId) {
      var designer = this;
      if (objId == null) return this.surface_transform;
      var res = undefined;
      dojox.gfx.utils.forEach(this.surface_transform, function (shape) {
        if (shape === designer.surface_transform) return;
        if (shape.objId == objId) res = shape;
      });
      return res;
    },

    forEachObjectShape: function(fn) {
      dojox.gfx.utils.forEach(this.surface_transform, function (shape) {
        if (shape === undefined || shape.objId === undefined) return;
        return fn(shape);
      });
    },

    forEachObjectShapeInBbox: function(bbox, fn) {
      this.forEachObjectShape(function (shape) {
        if (bbox.isSupersetOf(new sketchSpaceDesigner.designer.bbox.Bbox().addPoints(shape.getTransformedBoundingBox()))) {
          fn(shape);
        }
      });
    },

    registerObjectShape: function(shape) {
      if (shape.objId === undefined) {
        shape.objId = dojox.uuid.generateRandomUuid();
      }
      if (shape.userId === undefined) {
        shape.userId = this.userId;
      }
      this.getCurrentMode().enableShape(shape);
    },

    unregisterObjectShape: function(shape) {
      this.getCurrentMode().disableShape(shape);
    },

    editorShapeRemove: function(shape) {
      this.unregisterObjectShape(shape);
      shape.removeShape();
      this.imageUpdatedByUs();
    },

    editorAddShape: function(shapeDescription) {
      var shape = this.deserializeShape(this.editorGetShapeByObjId(shapeDescription.parent), shapeDescription.shape);
      this.registerObjectShape(shape);
      this.saveShapeToStr(shape);
    }

  });
})();
