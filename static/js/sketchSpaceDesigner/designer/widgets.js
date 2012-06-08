dojo.provide("sketchSpaceDesigner.designer.widgets");

dojo.require("dojox.widget.ColorPicker");
dojo.require("dojox.layout.TableContainer");
dojo.require("dijit.form.CheckBox");
dojo.require("dijit.form.NumberSpinner");
dojo.require("dijit.form.NumberTextBox");
dojo.require("dojox.layout.TableContainer");
dojo.require("dijit.layout._LayoutWidget");

dojo.declare("sketchSpaceDesigner.designer.widgets.ColorPickerPopup", [dojox.widget.ColorPicker], {
  create: function () {
    this.inherited(arguments);
    dijit.popup.moveOffScreen(this.domNode);
  },
  popup: function (popupFor, setColor) {
    var widget = this;
    dijit.popup.open({
      parent: null,
      popup: widget,
      around: popupFor,
      orient: {'BR':'TR', 'BL':'TL', 'TR':'BR', 'TL':'BL'},
      onExecute: function(){
       // dijit.popup.close(widget);
        setColor(widget.attr("value"));
      },
      onCancel: function(){ dijit.popup.close(widget); },
      onClose: function(){}
    });
    this.focus();
  },
  onBlur: function () {
    this.inherited(arguments);
    this.onCancel();
  },
  onCancel: function () {}
});

dojo.declare("sketchSpaceDesigner.designer.widgets.ColorInput", [dijit.form._FormValueWidget, dijit._Templated], {
  widgetsInTemplate: true,
  value: "#ff0000",
  templateString: '<span style="display: inline-block; width: 10pt; height: 10pt; border: 2px solid black; vertical-align: bottom;" dojoAttachEvent="onclick:_onClick" dojoAttachPoint="focusNode">' + 
                  '  <input dojoAttachPoint="valueNode" type="hidden" ${!nameAttrSetting} />' +
                  '  <span dojoType="sketchSpaceDesigner.designer.widgets.ColorPickerPopup" dojoAttachPoint="popup"></span>' +
                  '</span>',
  _setValueAttr: function(value, priorityChange){
    if (value === undefined)
      value = "";
    else if (value.toHex !== undefined)
      value = value.toHex();
    else if (value.r !== undefined)
      value = new dojox.color.Color(value).toHex();

    last_value = value;
    dojo.style(this.domNode, "background", value);
    this.inherited(arguments, [value]);
  },
  _getValueAttr: function(){
   return dojox.color.fromHex(this.value); // Somehow inherited(arguments) stopped working, this is a workaround...
  },
  _onClick: function (event) {
    var widget = this;
    this.popup.setColor(this.attr("value").toHex());
    this.popup.popup(this.domNode, function (color) { widget.attr("value", color); });
  }
});


dojo.declare("sketchSpaceDesigner.designer.widgets.OptionInput", [], {
  startup: function () {
    this.inherited(arguments);
    this.setAttrFromOptions(); // force an update from options
    this.setOptionsHandle = dojo.connect(this.attr("designer"), "setOptions", this, this.setAttrFromOptions);
    this.isStarted = true;
  },
  destroy: function () {
    dojo.disconnect(this.setOptionsHandle); 
    this.inherited(arguments);
  },
  setAttrFromOptions: function () {
    this.inhibitSetOptions = true;
    this.attr("value", this.attr("designer").getOptionByPath(this.attr("optionsPath")));
    this.inhibitSetOptions = false;
  },
  setOptionsFromAttr: function (value) {
    if (!this.inhibitSetOptions && this.isStarted) {
      var options = {};
      options[this.attr("optionsPath")] = value;
      this.attr("designer").setOptionsByPath(options);
    }
    return this.inherited(arguments);
  },
  _setValueAttr: function(value, priorityChange){
    this.setOptionsFromAttr(value);
    return this.inherited(arguments);
  },
  _setCheckedAttr: function(value, priorityChange){
    this.setOptionsFromAttr(value);
    return this.inherited(arguments);
  }
});

dojo.declare("sketchSpaceDesigner.designer.widgets.ColorOptionInput", [sketchSpaceDesigner.designer.widgets.ColorInput, sketchSpaceDesigner.designer.widgets.OptionInput], {});
dojo.declare("sketchSpaceDesigner.designer.widgets.OptionCheckBox", [dijit.form.CheckBox, sketchSpaceDesigner.designer.widgets.OptionInput], {});
dojo.declare("sketchSpaceDesigner.designer.widgets.OptionNumberSpinner", [dijit.form.NumberSpinner, sketchSpaceDesigner.designer.widgets.OptionInput], {});
dojo.declare("sketchSpaceDesigner.designer.widgets.OptionNumberTextBox", [dijit.form.NumberTextBox, sketchSpaceDesigner.designer.widgets.OptionInput], {});

/* Bug workaround */
dojo.declare("sketchSpaceDesigner.designer.widgets.TableContainer", [dojox.layout.TableContainer], {
  layout: function () {
    this._children = [];
    return this.inherited(arguments);
  }
});


dojo.declare("sketchSpaceDesigner.designer.widgets.ListContainer", [dijit.layout._LayoutWidget], {
	postCreate: function(){
		this.inherited(arguments);
		this._children = [];
	},

	startup: function() {
		if(this._started) {
			return;
		}
		this.inherited(arguments);

		// Call startup on all child widgets
		dojo.forEach(this.getChildren(), function(child){
			if(!child.started && !child._started) {
				child.startup();
			}
		});
		this.resize();
		this.layout();
	},

	resize: function(){
		dojo.forEach(this.getChildren(), function(child){
			if(typeof child.resize == "function") {
				child.resize();
			}
		});
	},

        baseClass: "listContainer",
        separatorClass: "listContainer-separator",
        itemWrapperClass: "listContainer-option",
        labelClass: "listContainer-label",
        childClass: "listContainer-child",

        separator: function () {
                this.domNode.appendChild(dojo.create("span", {"class": this.separatorClass}));
        },

        itemWrapper: function (child) {
                title = child.get("label") || child.get("title");
                if (title) {
                        var labeled = dojo.create("span", {"class": this.itemWraperClass}, this.domNode);
                        var label = dojo.create("label", {"for": child.get("id"), "class":this.labelClass}, labeled);
                        label.innerHTML = child.get("label") || child.get("title");
                        labeled.appendChild(child.domNode);
                } else {
                        this.domNode.appendChild(child.domNode);
                }	        
                dojo.addClass(child.domNode, this.childClass);
        },

	layout: function(){
   	        var children = this.getChildren();

                // Remove child dom nodes
		dojo.forEach(dojo.map(this.domNode.childNodes, function (x) { return x; }),  dojo.hitch(this, function(child, index){
                        this.domNode.removeChild(child);
		}));

		// Iterate over the children, (re-)adding them to the container.
		var first = true;
		dojo.forEach(children, dojo.hitch(this, function(child, index){
                        if (!first) {
                                this.separator();
                        }
                        first = false;
                        this.itemWrapper(child);
		}));

		// Refresh the layout of any child widgets, allowing them to resize
		// to their new parent.
		dojo.forEach(children, function(child){
			if(typeof child.layout == "function") {
				child.layout();
			}
		});

		this.resize();
	},
	
	destroyDescendants: function(/*Boolean*/ preserveDom){
		dojo.forEach(this._children, function(child){ child.destroyRecursive(preserveDom); });
	}
});



dojo.declare("sketchSpaceDesigner.designer.widgets.MenuContainer", [sketchSpaceDesigner.designer.widgets.ListContainer], {
        wrapper: function () {
	        this.wrapperContainer = dojo.create("ul", {"class": "menu_left"}, this.domNode);
        },

        separator: function () {
        },

        itemWrapper: function (child) {
                this.wrapperContainer.appendChild(this.wrapperContainer.domNode);
        }
});

dojo.declare("sketchSpaceDesigner.designer.widgets.OptionsContainer", [sketchSpaceDesigner.designer.widgets.ListContainer], {
        baseClass: "optionsContainer",
        separatorClass: "optionsContainer-separator",
        itemWrapperClass: "optionsContainer-option",
        labelClass: "optionsContainer-label",
        childClass: "optionsContainer-child"
});
