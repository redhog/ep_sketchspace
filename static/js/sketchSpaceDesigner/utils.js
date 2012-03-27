dojo.provide("sketchSpaceDesigner.utils");

sketchSpaceDesigner.utils.setObject = function (dst, src, onlyDefault) {
  for (name in src) {
    if (typeof(src[name]) == "object") {
      if (dst[name] === undefined) dst[name] = {};
      sketchSpaceDesigner.utils.setObject(dst[name], src[name], onlyDefault);
    } else {
      if (!onlyDefault || dst[name] === undefined)
        dst[name] = src[name];
    }
  }
  return dst;
}

sketchSpaceDesigner.utils.objectFromPaths = function (pathvalues) {
  var res = {};
  var path;
  for (path in pathvalues) {
    sketchSpaceDesigner.utils.setObjectByPath(res, path, pathvalues[path]);
  }
  return res;
}

sketchSpaceDesigner.utils.setObjectByPath = function (obj, path, value) {
  var pathItems = path.split(".");
  var i;

  for (i = 0; i < pathItems.length-1; i++) {
    if (obj[pathItems[i]] === undefined)
      obj[pathItems[i]] = {};
    obj = obj[pathItems[i]];
  }
  obj[pathItems[pathItems.length-1]] = value;
}

sketchSpaceDesigner.utils.getObjectByPath = function (obj, path) {
  var pathItems = path.split(".");
  var i;

  for (i = 0; i < pathItems.length; i++) {
    obj = obj[pathItems[i]];
  }
  return obj;
}

for (var i = 1; i < 128; i++)
  dojo.keys["CHAR_" + String.fromCharCode(i)] = i;

