/**
 * This file contains all code that synchronizes the pad with the
 * image in the editor. All images are synced all the time, not just
 * images that are currently displayed.
 *
 */

/**
 * There arwe three client side representations of an image. It is
 * represented as text with attributes in the pad text. There is also
 * an abstract image representation, a dict where every value is a
 * text-serialized json object for each image. Lastly, there can also
 * be a ready, rendered image of a single image that is displayed on screen.
 */

var padeditor = require('ep_etherpad-lite/static/js/pad_editor').padeditor;

// IE workaround
if(!Array.indexOf) {
  Array.prototype.indexOf = function(obj) {
    for(var i = 0; i < this.length; i++){
      if(this[i] == obj){
        return i;
      }
    }
    return -1;
  }
};

exports.waitForAll = function(events, cb) {
  this.waitFor = events;
  this.seen = {};
  this.cb = cb;
  this.executed = false;
}
exports.waitForAll.prototype._executeIfDone = function() {
  var w = this;
  if (w.executed) {
    return;
  }
  var done = this.waitFor.map(function (name) {
    return w.seen[name];
  }).reduce(function (a, b) { return a && b; }, true);
  if (done) {
    w.executed = true;
    w.cb();
  }
}
exports.waitForAll.prototype.emit = function(event) {
  this.seen[event] = true;
  this._executeIfDone();
}


exports.initEditor = new exports.waitForAll(["dojo", "ace"], function () {
  exports.initEditor.init();
});

exports.postAceInit = function(hook_name, args, cb) {
  exports.initEditor.emit("ace");
  return cb();
}

/**
 *
 * This hook inserts a bunch of Javascripts and CSS links into the editor iframe. They are used for styling of and making the image icons displayed in the main pad text clickable.
 */
exports.aceInitInnerdocbodyHead = function(hook_name, args, cb) {
  // FIXME: relative paths
  args.iframeHTML.push('<link rel="stylesheet" type="text/css" href="/static/plugins/ep_sketchspace/static/css/ace.css"/>');
  args.iframeHTML.push('<script type="text/javascript" src="/static/plugins/ep_sketchspace/static/js/ace_inner.js"></script>');
  return cb();
};

exports.aceAttribsToClasses = function(hook_name, args, cb) {
  if (args.key == 'sketchSpaceIsImage' && args.value != "")
    return cb(["sketchSpaceIsImage", "sketchSpaceImageId:" + args.value]);
  else if (args.key.indexOf('sketchSpaceImageObject') == 0)
    return cb([args.key + ":" + args.value]);
  else if (args.key.indexOf('sketchSpaceImageZ;')==0)
    return cb([args.key + ":" + args.value]);
  else if (args.key == 'sketchSpaceImageZSequence')
    return cb([args.key + ":" + args.value]);
  else if (args.key == 'sketchSpaceImageIsCurrent')
    return cb([args.key + ":" + args.value]);
};

/**
 * This function is called when server side image updates are recieved.
 * The function deletes the old abstract image representation and recreates it from scratch based
 * on the pad textual representation of the image.
 * If the updated image is currently displayed, call the updateImageFromPad event handler to update the screen as well.
 */
exports.aceCreateDomLine = function(hook_name, args, cb) {
    if (exports.editorUi === undefined) return cb();

  if (args.cls.indexOf('sketchSpaceIsImage') >= 0) {
    var clss = [];
    var imageObjects = {};
    var imageId = undefined;
    var argClss = args.cls.split(" ");
    var zSequence = 0;

    /*
     * zOrderUpdates is an array of all z order update attributes. Every
     * array cell is another array, where the first element is a sort
     * key, the second element is an array of object IDs and the third
     * element is an array of Z indices (as strings).
     */

    var zOrderUpdates=[];
    var order=[];
    var isCurrentImage = false;
    for (var i = 0; i < argClss.length; i++) {
      var cls = argClss[i];
      if (cls.indexOf(":") != -1) {
	var key = cls.substr(0, cls.indexOf(":"));
	var val = cls.substr(cls.indexOf(":")+1);

	if (key == "sketchSpaceImageId") {
	  clss.push("sketchSpaceImageId_" + val);
	  imageId = val;
	} else if (key == "sketchSpaceImageObject") {
	  var objId = val.substr(0, val.indexOf(":"));
	  var properties = val.substr(val.indexOf(":")+1);
	  imageObjects[objId] = unescape(properties);
	} else if (key.indexOf('sketchSpaceImageZ;')==0){
	  var idx = val.split(';');
	  var oId = key.split(';');
	  oId.shift();
	  var seq = parseInt(oId.shift(),10);
	  zOrderUpdates.push([ seq, oId, idx ]);
	} else if (key == 'sketchSpaceImageZSequence'){
	  val = parseInt(val, 10);
	  zSequence = val;
        } else if (key == "sketchSpaceImageIsCurrent") {
 	  isCurrentImage = true;
	  clss.push("sketchSpaceImageIsCurrent");
	} else {
	  clss.push(cls);
	}

      } else {
	clss.push(cls);
      }
    }

    // Sort all z changes into time order
    zOrderUpdates.sort(
      function(a,b){
	if( a[0] != b[0])
	  return a[0] - b[0];
	/* Completely arbitrary tie breaker - but needs to be deterministic */
	for(var i=0; i<Math.min(a[1].length, b[1].length); i++) {
	  if(a[1][i]!=b[1][i])
	    return a[1][i] > b[1][i]?1:-1;
	}
	return a[1].length - b[1].length;
      }
    );

    // Recreate the current order of objects by replaying all changes in order
    for(var j=0; j<zOrderUpdates.length; j++) {
      var val = zOrderUpdates[j];
      var objId = val[1];
      var zIdxStr = val[2];
      for(var i=0; i<objId.length; i++) {
	var currZIdx = order.indexOf(objId[i]);
	if(currZIdx != -1){
	  order.splice(currZIdx, 1);
	}
	var zIdx = parseInt(zIdxStr[i], 10);
	if(zIdx >= 0) {
    	  order.splice(zIdx, 0, objId[i]);
	}
      }
    }
    exports.editorUi.editor.images[imageId] = {objects:imageObjects, order:order, zSequence: zSequence};

    this.currentImage = undefined;
    if (isCurrentImage)
      exports.editorUi.editor.selectSharedImage(imageId);
    if (exports.editorUi.editor.currentImage == imageId) {
      exports.updateImageFromPadIfNeeded();
    }

    return cb([{cls: clss.join(" "), extraOpenTags: '', extraCloseTags: ''}]);
  }
};

exports.incorporateUserChanges = exports.performDocumentApplyChangeset = function () {
  var sharedImageLink = this.getImageLinkFromId(exports.editorUi.editor.currentSharedImage);

  if (sharedImageLink === undefined || !$(sharedImageLink).hasClass("sketchSpaceImageIsCurrent"))
    this.deselectSharedImage();
  if (this.getImageLinkFromId(exports.editorUi.editor.currentImage) === undefined)
    this.deselectImage();
};

exports.updateImageFromPadIfNeeded = function() {
  if (this.currentImage != exports.editorUi.editor.currentImage)
    this.updateImageFromPad();
  this.currentImage = exports.editorUi.editor.currentImage;
};

/**
 *
 */
exports.updateImageFromPad = function() {
  if (exports.editorUi.editor.currentImage !== undefined) {
    var currentImage = exports.editorUi.editor.images[exports.editorUi.editor.currentImage].objects;
    var order = exports.editorUi.editor.images[exports.editorUi.editor.currentImage].order;

    /* Some debug info printing:
    console.log("Image:");
    exports.editorUi.editor.forEachObjectShape(function (shape) { console.log(shape.objId); })
    console.log("Pad:");
    for (name in currentImage)
      console.log(name);
    */

    var visited = {};
    var toDelete = {};

    // Mark all changed/deleted shapes for delation
    exports.editorUi.editor.forEachObjectShape(function (shape) {
      if (currentImage[shape.objId] === undefined) {
        toDelete[shape.objId] = shape;
      } else {
        if (shape.strRepr == currentImage[shape.objId]) {
          visited[shape.objId] = shape;
        } else {
          toDelete[shape.objId] = shape;
        }
      }
    });

    // Perform deletion. This must be done after iteration or we'll
    // miss objects unpredictably because forEachObjectShape can't
    // handle graph changes while iterating.

    for (objId in toDelete) {
      toDelete[objId].removeShape();
    }

    // Given an object ID, this function will locate the corresponding
    // text data in the abstract image description and the create a
    // true editor image shape based on that description.

    // If the visited dict already contains the specified object id,
    // it will be assumed to be unchanged and will not be touched.

    function materialize (objId) {
      if (visited[objId] === undefined) {
        var objStr = currentImage[objId];
	// FIXME: Handle that objStr is undefined here... can happen
	// if stuff changed between the loop above and this function.
        var obj = dojo.fromJson(objStr);

	var parent = exports.editorUi.editor.surface_transform;
	if (obj.parent) parent = materialize(obj.parent);

        var shape = exports.editorUi.editor.deserializeShape(parent, obj.shape);
	exports.editorUi.editor.registerObjectShape(shape);

        shape.objId = objId;
        shape.strRepr = objStr;
	visited[objId] = shape;
      }
      return visited[objId];
    };

    for (var objId in currentImage)
      materialize(objId);

    $.each(
      order, function(key, val){
//	console.log(val);
	if(visited[val])
  	  visited[val].moveToFront();
      }
      );

    exports.editorUi.editor.imageUpdatedByOthers();
  }
};

exports.updatePadFromImage = function() {
  if (exports.editorUi.editor.currentImage !== undefined) {
    var currentImageId = exports.editorUi.editor.currentImage;
    var currentImage = exports.editorUi.editor.images[currentImageId].objects;
    var oldOrder=exports.editorUi.editor.images[currentImageId].order;
    var zSequence=exports.editorUi.editor.images[currentImageId].zSequence;

    var visited = {};
    var update = [];

    var shapeIdx = 0;

    var newOrder=[];

    var zOrderUpdate = [];

    var oldIds = {
    };
    $.each(oldOrder, function(key,val){
	     oldIds[val]=true;
	   }
	  );

    var shapeIdx=0;
    exports.editorUi.editor.forEachObjectShape(function (shape) {
      newOrder.push(shape.objId);
      if(shape.zOrderMoved){
	shape.zOrderMoved = undefined;
	zOrderUpdate.push([shape.objId, shapeIdx]);
      } else if(!(shape.objId in oldIds)){
	zOrderUpdate.push([shape.objId, shapeIdx]);
      }
      if (currentImage[shape.objId] === undefined || currentImage[shape.objId] != shape.strRepr) {
        update.push(["sketchSpaceImageObject:" + shape.objId, escape(shape.strRepr)]);
      }
      visited[shape.objId] = shape;
      shapeIdx++;
    });

    for (var objId in currentImage) {
      if (visited[objId] === undefined) {
	update.push(["sketchSpaceImageObject:" + objId, ""]);
	update.push(["sketchSpaceImageZ;" + (++zSequence) + ";" + objId, "-1"]);
      }
    }

    if (zOrderUpdate.length){

      var objIdArr = newOrder;
      var idxArr = [];
      $.each(newOrder, function(key){idxArr.push(key);});

      var objIdStr = "";
      var idxStr = "";
      // Create a diff between previous and current Z order
      $.each(
	zOrderUpdate,
	function(key, value){
	  if(key != 0){
	    objIdStr += ";";
	    idxStr += ";";
	  }
	  objIdStr += value[0];
	  idxStr += value[1];
	}
      );

      var diff = ["sketchSpaceImageZ;"+(++zSequence)+";" + objIdStr, idxStr];
      update.push(diff);
    }

    if (zSequence != exports.editorUi.editor.images[currentImageId].zSequence) {
      update.push(["sketchSpaceImageZSequence", "" + zSequence]);
    }

    //    console.log(update);
    this.updatePad(currentImageId, update);
  }
};

exports.updatePad = function (imageId, update) {
  var sketchSpace = this;
  padeditor.ace.callWithAce(function (ace) {
    sketchSpace.ace_updatePad(ace, imageId, update);
  }, "updatePadFromImage", true);
};

exports.getImageLinkFromId = function (imageId) {
  return $($($("#editorcontainer iframe")[0].contentDocument).find("body iframe")[0].contentDocument).find(".sketchSpaceImageId_" + imageId)[0];
};

exports.getImageIdFromLink = function (imageLink) {
  var imageId;
  $.each($(imageLink).attr('class').split(' '), function (idx, cls) {
    var parts = cls.split("_");
    if (parts[0] == "sketchSpaceImageId")
      imageId = parts[1];
  });
  return imageId;
};

exports.imageLinkClicked = function(imageLink) {
  var imageId = this.getImageIdFromLink(imageLink);

  if (exports.editorUi.editor.currentImage == imageId)
    this.userDeselectImage();
  else
    this.userSelectImage(imageId);
};

exports.userSelectImage = function(imageId) {
  if (typeof(pad) != "undefined" && exports.editorUi.editor.options.shareCurrentImage) {
    if (exports.editorUi.editor.currentSharedImage != imageId) {
      var sketchSpace = this;

      if (exports.editorUi.editor.currentSharedImage !== undefined)
	this.updatePad(exports.editorUi.editor.currentSharedImage, [["sketchSpaceImageIsCurrent", ""]]);

      this.updatePad(imageId, [["sketchSpaceImageIsCurrent", "true"]]);

      /* FIXME: This is an ugly bug workaround: Sometimes, clients don't seem to update properly... Note the "truer" != "true"... 
      setTimeout(
        function () {
          sketchSpace.updatePad(imageId, [["sketchSpaceImageIsCurrent", "truer"]]);
        }, 500);
      */

    } else {
      // console.log("You selected the same image again!");
    }
  } else {
    this.selectImage(imageId);
  }
};

exports.userDeselectImage = function() {
};

exports.selectImage = function(imageId) {
  exports.editorUi.editor.selectImage(imageId);
  this.updateImageFromPad();
};

exports.userDeselectImage = function () {
  if (typeof(pad) != "undefined" && exports.editorUi.editor.options.shareCurrentImage) {
    if (exports.editorUi.editor.currentSharedImage !== undefined)
      this.updatePad(exports.editorUi.editor.currentSharedImage, [["sketchSpaceImageIsCurrent", ""]]);
  } else {
    this.deselectImage();
  }
};

exports.deselectImage = function () {
  this.currentImage = undefined;
  exports.editorUi.editor.deselectImage();
};

exports.deselectSharedImage = function () {
  exports.editorUi.editor.deselectSharedImage();
};

exports.insertImage = function() {
  var sketchSpace = this;

  return padeditor.ace.callWithAce(function (ace) {
    return sketchSpace.ace_insertImage(ace);
  }, "sketchSpace", true);
};

exports.ace_getImageRange = function (ace, imageId) {
  var imageLink = this.getImageLinkFromId(imageId);
  return [ace.ace_getLineAndCharForPoint({node: imageLink, index:0, maxIndex:1}),
	  ace.ace_getLineAndCharForPoint({node: imageLink, index:1, maxIndex:1})];
};

exports.ace_updatePad = function (ace, imageId, update) {
  var imageRange = this.ace_getImageRange(ace, imageId);
  ace.ace_performDocumentApplyAttributesToRange(imageRange[0], imageRange[1], update);
};

exports.ace_insertImage = function(ace) {
  var imageId = dojox.uuid.generateRandomUuid();
  rep = ace.ace_getRep();

  ace.ace_replaceRange(rep.selStart, rep.selEnd, "I");
  ace.ace_performSelectionChange([rep.selStart[0],rep.selStart[1]-1], rep.selStart, false);
  ace.ace_performDocumentApplyAttributesToRange(rep.selStart, rep.selEnd, [["sketchSpaceIsImage", imageId]]);

  return imageId;
};
