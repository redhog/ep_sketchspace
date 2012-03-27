// This is a hack to get around ACEs brain-dead limit on onClick on
// links inside the ACE domlines...

$(document).ready(function () {
  $("body").mousedown(function (event) {
    var target = undefined;
    if ($(event.target).filter(".sketchSpaceIsImage").length > 0) {
      parent.parent.sketchSpace.imageLinkClicked(event.target);
    }
  });
});
