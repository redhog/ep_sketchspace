dojo.provide("sketchSpaceDesigner.designer.modes.Edit");

dojo.require("sketchSpaceDesigner.designer.modes.Zoom");

dojo.declare("sketchSpaceDesigner.designer.modes.Edit", [sketchSpaceDesigner.designer.modes.Zoom], {
  enable: function () {
    this.inherited(arguments);

    this.strokeColorPicker = new dijit.layout._LayoutWidget({title:"Stroke [s]:"});
    this.strokeColorPicker.addChild(new sketchSpaceDesigner.designer.widgets.OptionCheckBox({optionsPath:"doStroke", designer:this.designer}));
    this.strokeColorPicker.addChild(new sketchSpaceDesigner.designer.widgets.ColorOptionInput({optionsPath:"stroke.color", designer:this.designer, style:"vertical-align:middle;"}));
    this.strokeColorPicker.addChild(new sketchSpaceDesigner.designer.widgets.OptionNumberSpinner({optionsPath:"stroke.width", designer:this.designer, style:"width:30pt"}));
    this.designer.ui.options.addChild(this.strokeColorPicker);

    this.fillColorPicker = new dijit.layout._LayoutWidget({title:"Fill [f]:"});
    this.fillColorPicker.addChild(new sketchSpaceDesigner.designer.widgets.OptionCheckBox({optionsPath:"doFill", designer:this.designer}));
    this.fillColorPicker.addChild(new sketchSpaceDesigner.designer.widgets.ColorOptionInput({title:"Fill:", optionsPath:"fill", designer:this.designer}));
    this.designer.ui.options.addChild(this.fillColorPicker);

    this.designer.ui.options.layout();
  },
  disable: function () {
    this.inherited(arguments);
    this.strokeColorPicker.destroyRecursive();
    this.fillColorPicker.destroyRecursive();
    this.designer.ui.options.layout();
  },
  getContainerShape: function () { return this.designer.surface_transform; }
});
