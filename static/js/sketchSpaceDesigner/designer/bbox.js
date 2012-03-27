dojo.provide("sketchSpaceDesigner.designer.bbox");

dojo.declare("sketchSpaceDesigner.designer.bbox.Bbox", [], {
  constructor: function (copyFrom) {
    if (copyFrom === undefined) copyFrom = {};
    if (typeof(copyFrom) == "string") {
      copyFrom = copyFrom.split(":");
      copyFrom = copyFrom[0].split(",").concat(copyFrom[1].split(","));
      copyFrom = {x:parseFloat(copyFrom[0]),
		  y:parseFloat(copyFrom[1]),
		  width:parseFloat(copyFrom[2]),
		  height:parseFloat(copyFrom[3])};
    }
    this.x = copyFrom.x;
    this.y = copyFrom.y;
    this.width = copyFrom.width;
    this.height = copyFrom.height;
  },

  // Listen to this for changes
  onChange: function () {},

  copy: function() {
    return new sketchSpaceDesigner.designer.bbox.Bbox(this);
  },

  makeEmpty: function() { this.x = undefined; this.y = undefined; this.width = undefined; this.height = undefined; this.onChange(); },

  add: function(bbox) { /* rename to union? */
    if (this.isEmpty(bbox)) {
      /* Do nothing */
    } else if (this.isEmpty()) {
      this.x = bbox.x;
      this.y = bbox.y;
      this.width = bbox.width;
      this.height = bbox.height;
    } else {
      var old = {x:this.x, y:this.y}

      this.x = Math.min(this.x, bbox.x);
      this.y = Math.min(this.y, bbox.y);

      this.width = Math.max(old.x + this.width, bbox.x + bbox.width) - this.x;
      this.height = Math.max(old.y + this.height, bbox.y + bbox.height) - this.y;
    }
    this.onChange();
    return this;
  },

  intersection: function(bbox) {
    if (this.isEmpty(bbox)) {
      this.makeEmpty();
    } else if (this.isEmpty()) {
      /* Do nothing */
    } else {
      var old = {x:this.x, y:this.y}

      this.x = Math.max(this.x, bbox.x);
      this.y = Math.max(this.y, bbox.y);

      this.width = Math.max(Math.min(old.x + this.width, bbox.x + bbox.width) - this.x, 0);
      this.height = Math.max(Math.min(old.y + this.height, bbox.y + bbox.height) - this.y, 0);
    }
    this.onChange();
    return this;
  },

  addPoint: function(point) {
    if (this.x === undefined) {
      this.x = point.x;
      this.y = point.y;
      this.width = 0;
      this.height = 0;
    } else {
      if (point.x < this.x) {
	this.width += this.x - point.x;
	this.x = point.x;
      } else if (point.x > this.x + this.width) {
	this.width = point.x - this.x;
      }
      if (point.y < this.y) {
	this.height += this.y - point.y;
	this.y = point.y;
      } else if (point.y > this.y + this.height) {
	this.height = point.y - this.y;
      }
    }
    this.onChange();
    return this;
  },

  addPoints: function(points) {
    var bbox = this;
    $.each(points, function (index, point) {
      bbox.addPoint(point);
    });
    return this;
  },

  corners: function () {
    var x = [this.x, this.x + this.width];
    var y = [this.y, this.y + this.height];
    return [{x:x[0], y:y[0]},
	    {x:x[0], y:y[1]},
	    {x:x[1], y:y[0]},
	    {x:x[1], y:y[1]}];
  },

  transform: function (matrix) {
    if (!this.isEmpty()) {
      var corners = this.corners();
      this.makeEmpty();
      this.addPoints($.map(
        corners,
	function (p) {
	  return dojox.gfx.matrix.multiplyPoint(matrix, p.x, p.y);
	}
      ));
    }
    this.onChange();
    return this;
  },

  round: function (precission) {
    /* Expands a bbox to have all four corners on multiples of
     * precission.x respectively precission.y pixels. The maximum
     * expansion is thus 2*precission.x-1 resp. 2*precission.y-1 */

    var old = {x:this.x, y:this.y}

    this.x = Math.floor(this.x / precission.x) * precission.x;
    this.y = Math.floor(this.y / precission.y) * precission.y;
    
    this.width = Math.ceil((old.x + this.width) / precission.x) * precission.x - this.x;
    this.height = Math.ceil((old.y + this.height) / precission.y) * precission.y - this.y;
    this.onChange();
    return this;
  },

  powround: function (base, factor) {
    /* Like round, but sets the precission to the nearest lower power
     * of base to the width(height) of the bbox, or to the width
     * divided by factor. */
    if (factor === undefined) factor = {x:1, y:1};
    return this.round({x:Math.pow(base.x, Math.floor(Math.log(this.width/factor.x)/Math.log(base.x))),
                       y:Math.pow(base.y, Math.floor(Math.log(this.height/factor.y)/Math.log(base.y)))});
  },

  roundSize: function (precission) {
    /* Expands a bbox to have width/height be multiples of
     * precission.x respectively precission.y pixels. The maximum
     * expansion is thus precission.x-1 resp. precission.y-1 */

    this.width = Math.ceil(this.width / precission.x) * precission.x;
    this.height = Math.ceil(this.height / precission.y) * precission.y;
    this.onChange();
    return this;
  },

   powroundSize: function (base, factor) {
     /* Like roundSize, but sets the precission to the nearest lower
      * power of base to the width(height) of the bbox, or to the
      * width divided by factor. */
     if (factor === undefined) factor = {x:1, y:1};
     return this.roundSize({x:Math.pow(base.x, Math.floor(Math.log(this.width/factor.x)/Math.log(base.x))),
                            y:Math.pow(base.y, Math.floor(Math.log(this.height/factor.y)/Math.log(base.y)))});
  },

  isEmpty: function(bbox) {
    if (bbox === undefined) bbox = this;
    return bbox.x === undefined;
  },

  isEqual: function (other) {
    return this.x == other.x && this.y == other.y && this.width == other.width && this.height == other.height;
  },

  isSupersetOf: function (other) {
    return this.isEqual(this.copy().add(other));
  },

  isSubsetOf: function (other) {
    return other.isEqual(other.copy().add(this));
  },

  containsPoint: function (point) {
    return point.x >= this.x && point.y >= this.y && point.x <= this.x + this.width && point.y <= this.y + this.height;
  },

  toString: function () {
    return "" + this.x + "," + this.y + ":" + this.width + "," + this.height;
  }

});
