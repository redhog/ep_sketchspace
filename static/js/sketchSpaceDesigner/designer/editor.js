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
    if (description.extType == "zimage") {
      shape = this.createImage(parent, description.imageName, description.page);
      if (description.transform !== undefined)
        shape.setTransform(description.transform);
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

    if (shape.extType == "zimage") {
      description = {extType: "zimage", imageName: shape.imageName, page:shape.page, transform:shape.getTransform()};
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
  },

  createImage: function(parent, imageName, page) {
    var designer = this;

    var image = parent.createGroup();
    image.extType = "zimage";
    image.background = undefined;
    image.currentDisplay = undefined;
    image.imageName = imageName;
    image.page = page ? page : 0;
    image.updateDisplay = function () {
      var image = this;
      if (image.background === undefined)
        image.background = dojox.gfx.utils.deserialize(image, {shape:{type:"rect", x:0, y:0, width:100, height:100}, fill:{r:196,g:196,b:196,a:1}});
      if (this.pointSize === undefined) {
	dojo.xhrGet({
	  url: "/ep/imageConvert/" + this.imageName + "?action=getSize&p=" + image.page,
	  handleAs: "json",
	  load: function(data){
	    image.pointSize = data;
	    image.updateDisplay();
	  }
	});
      } else {
        var shape = image.background.getShape();
	shape.width = this.pointSize.w;
	shape.height = this.pointSize.h;
	image.background.setShape(shape);

	var objToScreenMatrix = this._getRealMatrix();
	var screenToObjMatrix = dojox.gfx.matrix.invert(objToScreenMatrix);

	var screenBboxOnObj = new sketchSpaceDesigner.designer.bbox.Bbox({x: 0, y: 0, width:designer.surface_size.width, height:designer.surface_size.height}).transform(screenToObjMatrix);
	var objBboxOnObj = new sketchSpaceDesigner.designer.bbox.Bbox({x: 0, y: 0, width:this.pointSize.w, height:this.pointSize.h});

	// Rounding here does not seem to work with all renderers :(
	var displayBboxOnObj = objBboxOnObj.copy().intersection(screenBboxOnObj); //.powround({x:2, y:2}, {x:8, y:8});
	var displayBboxOnScreen = displayBboxOnObj.copy().transform(objToScreenMatrix); //.powroundSize({x:2, y:2}, {x:8, y:8});

	//console.log("zoom: " + displayBboxOnObj.toString() + " @ " + displayBboxOnScreen.width + ":" + displayBboxOnScreen.height);

	// Make sure our offset and size is in the source image is in whole pixels (after scaling) as some renderers require this! 
	var objToPixelMatrix = dojox.gfx.matrix.scale(displayBboxOnScreen.width / displayBboxOnObj.width,
						      displayBboxOnScreen.height / displayBboxOnObj.height);
	var pixelToObjMatrix = dojox.gfx.matrix.invert(objToPixelMatrix);
	var displayBboxOnObjInScreenPixels = displayBboxOnObj.copy().transform(objToPixelMatrix).round({x:1, y:1});
	displayBboxOnObj = displayBboxOnObjInScreenPixels.copy().transform(pixelToObjMatrix);

//	console.log("Bbox: inPixels=" + displayBboxOnObjInScreenPixels + "; inPoints=" + displayBboxOnObj);

	if (isNaN(displayBboxOnObj.x) || isNaN(displayBboxOnObj.y) || isNaN(displayBboxOnObj.width) || isNaN(displayBboxOnObj.height) || isNaN(displayBboxOnScreen.width) || isNaN(displayBboxOnScreen.height) ||
	    displayBboxOnObj.width < 1 || displayBboxOnObj.height < 1 || displayBboxOnScreen.width < 1 || displayBboxOnScreen.height < 1) {
 	  console.log("NaN: onObj=" + displayBboxOnObj + "; onScreen=" + displayBboxOnScreen);
  	  image.newShape = undefined;
	  if (image.currentDisplay !== undefined)
	    image.currentDisplay.removeShape();
	  image.currentDisplay = undefined;
	  return;
        }

	var newShape = {
	  x:displayBboxOnObj.x,
	  y:displayBboxOnObj.y,
	  width:displayBboxOnObj.width,
	  height:displayBboxOnObj.height,
	  src: "/ep/imageConvert/" + this.imageName +
	    "?p=" + image.page +
	    "&x=" + displayBboxOnObj.x +
	    "&y=" + displayBboxOnObj.y +
	    "&w=" + displayBboxOnObj.width +
	    "&h=" + displayBboxOnObj.height +
	    "&px=" + displayBboxOnObjInScreenPixels.x + 
	    "&py=" + displayBboxOnObjInScreenPixels.y + 
	    "&pw=" + displayBboxOnObjInScreenPixels.width +
	    "&ph=" + displayBboxOnObjInScreenPixels.height
        };

	var oldShape = this.currentDisplay ? this.currentDisplay.getShape() : undefined;

	if (!oldShape || oldShape.src != newShape.src) {

	  image.newShape = newShape;

	  // Preload the image to the cache...
	  dojo.xhrGet({
	    url: newShape.src,
	    load: function(data){
	      /* Now when the image is in the cache, "load" the image */
	      /* We've already zoomed more, forget about it... */
 	      if (image.newShape != newShape) return;
	      var lastDisplay = this.currentDisplay;
	      image.currentDisplay = image.createImage(newShape);
	      if (lastDisplay) lastDisplay.removeShape();
	    }
	  });
        }
      }
    }
    image.updateDisplayLazy = function () {
      if (this.updateDisplayTimout !== undefined) return;
      var image = this;
      this.updateDisplayTimout = window.setTimeout(function () {
	image.updateDisplay();
	image.updateDisplayTimout = undefined;
      }, 1000);
    }
    image.getTransformedBoundingBox = function () {
      var objToScreenMatrix = this._getRealMatrix();
      return new sketchSpaceDesigner.designer.bbox.Bbox({x: 0, y: 0, width:this.pointSize.w, height:this.pointSize.h}).transform(objToScreenMatrix).corners();
    }

    image.updateDisplay();
    image.updateHandle = dojo.connect(designer, "viewUpdated", image, image.updateDisplayLazy);

    return image;
  }
});
