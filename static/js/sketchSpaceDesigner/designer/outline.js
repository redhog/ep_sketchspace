dojo.provide("sketchSpaceDesigner.designer.outline");

dojo.require("dojox.gfx.matrix");

sketchSpaceDesigner.designer.outline.createOutline = function (designer, bbox, lineDefinitions) {
  var outline = designer.surface.createGroup();
  outline.designer = designer;
  outline.bbox = bbox;
  outline.lineDefinitions = lineDefinitions || [{color:{r:128,g:128,b:128,a:1},width:1, style:"solid"}];
  outline.lines = [];

  outline.update = function () {
    var outline = this;
    $.each(outline.lines, function() { this.removeShape(); });

    outline.setTransform(dojox.gfx.matrix.translate(outline.bbox.x, outline.bbox.y));
    outline.originalMatrix = outline.matrix;

    outline.lines = $.map(outline.lineDefinitions, function (def, idx) {
      return dojox.gfx.utils.deserialize(outline, {shape:{type:"rect", x:-idx*2, y:-idx*2, width:outline.bbox.width+idx*4, height:outline.bbox.height+idx*4}, stroke:def});
    });
  };

  outline.update();

  return outline;
};
