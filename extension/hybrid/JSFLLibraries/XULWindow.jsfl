/**
 * Represents a XUL panel in JSFL.  The object can be set up and then used to invoke a XUL panel without writing an actual XUL file.
 * The XML can be generated purely in JSFL and passed in, or you can use convenience methods to add various controls without having
 * to writing XML strings in JSFL.
 *
 * <p>For full-on XUL reference, the Mozilla document is here: <a href="https://developer.mozilla.org/en/XUL_Reference">
 * https://developer.mozilla.org/en/XUL_Reference</a>.  Note that Flash supports a very small subset of this.</p>
 *
 **/

/**
 * Constructor
 * @param	title	The title of the window.  This is only used if you own XML string is not passed in to the <code>create</code>
 * 					method.
 * @param	buttons	The remaining arguments are Strings of types of buttons to include.  For convenience, use the static
 * 					constants XULWindow.ACCEPT and XULWindow.CANCEL.  This is only used if you own XML string is not passed in to
 * 					the <code>create</code> method.
 **/
var XULWindow = function (title) {
    this._title = title || "Options";

    var buttons = [];
    var iLen = arguments.length;
    for (var i = 1; i < iLen; i++) {
        buttons.push(arguments[i]);
    }

    this._columns = false;
    this._xml = '';
    this._tab = 1;

    /**
     *  Create muliple columns
     *  @method columns
     *  @param {int} cols* The flex amounts of columns
     *  @return {XULWindow} The instance, for chaining
     */
    this.columns = function () {
        this._columns = arguments;
        return this;
    };

    /**
     * Creates a XUL window panel.  It is attached to the current document
     *
     * @param	xul		A String of raw XUL to create.  If null, the window will be created according to the various control
     * 					creation methods.  If not null, any other method calls would be ignored and the passed-in XUL is used.
     * @return	An object containing information about the user input.  The object will have a property called <code>dismiss</code>
     * 			that contains the name of the button that was clicked (either <code>XULWindow.ACCEPT</code> or
     * 			&lt;code>XULWindow.CANCEL</code>).  It will
     * 			also have other properties, named after the various controls' id values.  The value contained by these properties
     * 			will be the value associated with the input of the control.
     **/
    this.create = function (xul) {
        var doc = fl.getDocumentDOM();
        if (!doc) {
            alert("There is no open document.  XUL Windows need to be attached to a document. [XULWindow::create()]");
            return;
        }

        var xulFilePath = fl.configURI + escape(this._title) + ".xul";

        // If there's no XUL supplied
        if (!xul) {
            // Create the dialog
            xul = '<dialog title="' + title + '" buttons="' + buttons.join(",") + '">';

            // Create the column layout
            if (this._columns && this._columns.length > 1) {
                xul += '<content><grid><columns id="columns">';

                // Add the columns
                for (var i = 0; i < this._columns.length; i++) {
                    xul += '<column flex="' + this._columns[i] + '" />';
                }

                // Add the closing layout plus the dialog contents
                xul += '</columns><rows id="controls">' + this._xml + '</rows></grid></content>';
            } else {
                // Just add the contents
                xul += this._xml;
            }
            xul += '</dialog>';
        }

        FLfile.write(xulFilePath, xul);
        var options = fl.getDocumentDOM().xmlPanel(xulFilePath);
        FLfile.remove(xulFilePath);

        return options;
    };

    /**
     *  Creates a check box control with a label.
     *  @method addCheckbox
     *  @param	label	String for the label next to the check box.
     *  @param	id		String for the id of the checkbox.  This is the name of the property on the returned object with data in it
     *  @param	checked	Whether initially checked or not.
     *  @return {XULWindow} The instance, for chaining
     */
    this.addCheckbox = function (label, id, checked) {
        this._xml += '<checkbox label="' + label + '" id="' + id + '" checked="' + (checked ? "true" : "false") + '" />';
        return this;
    };

    /**
     *  Start a row element
     *  @method openRow
     *  @return {XULWindow} The instance, for chaining
     */
    this.openRow = function () {
        if (!this._columns) {
            alert("XULWindow::openRow() requires XULWindow::columns() to be set.");
            return this;
        }
        this._xml += '<row>';
        return this;
    };

    /**
     *  Close a row element
     *  @method closeRow
     *  @return {XULWindow} The instance, for chaining
     */
    this.closeRow = function () {
        if (!this._columns) {
            alert("XULWindow::closeRow() requires XULWindow::columns() to be set.");
            return this;
        }
        this._xml += '</row>';
        return this;
    };

    /**
     *  Add a spacer
     *  @method addSpacer
     *  @return {XULWindow} The instance, for chaining
     */
    this.addSpacer = function () {
        this._xml += '<spacer />';
        return this;
    };

    /**
     *  Add a separator
     *  @method addSeparator
     *  @return {XULWindow} The instance, for chaining
     */
    this.addSeparator = function () {
        this._xml += '<separator />';
        return this;
    };

    /**
     * Opens an &lt;hbox&gt; nodes so that all controls added after this method call are contained within the hbox.  Should
     * be ultimately terminated with <a href="#closeHBox">closeHBox</a>
     *
     * @see #closeHBox
     *  @return {XULWindow} The instance, for chaining
     */
    this.openHBox = function () {
        this._xml += "<hbox>";
        return this;
    };

    /**
     * Closes a previously open &lt;hbox&gt;, enclosing all intermediate controls within an hbox node.
     *
     * @see #openHBox
     *  @return {XULWindow} The instance, for chaining
     */
    this.closeHBox = function () {
        this._xml += "</hbox>";
        return this;
    };

    /**
     *  Opens an &lt;vbox&gt; nodes so that all controls added after this method call are contained within the vbox.  Should
     *  be ultimately terminated with <a href="#closeVBox">closeVBox</a>
     *  @method openVBox
     *  @see #closeVBox
     *  @return {XULWindow} The instance, for chaining
     */
    this.openVBox = function () {
        this._xml += "<vbox>";
        return this;
    };

    /**
     *  Closes a previously open &lt;vbox&gt;, enclosing all intermediate controls within an vbox node.
     *  @method closeVBox
     *  @see #openVBox
     *  @return {XULWindow} The instance, for chaining
     */
    this.closeVBox = function () {
        this._xml += "</vbox>";
        return this;
    };

    /**
     *  @private
     *  Adds a button to the panel, but I assume there might be more involved in getting one to do something than we can realistically
     *  accomplish here.
     *  @method addButton
     *  @return {XULWindow} The instance, for chaining
     */
    this.addButton = function (label, id, accessKey, autocheck) {
        this._xml += '<button label="' + label + '" id="' + id + '" accesskey="' + accessKey + '" autocheck="' + autocheck + '" tabindex="' + (this._tab++) + '" />';
        return this;
    };

    /**
     *  Creates a List Box.
     *  @method addListBox
     *  @param	id		The name of the property on the returned object with data in it.
     *  @param	items	Array of Objects specifying the items to display.  The Objects should take on the following form:
     *  						<code>{label:"Text to display", value:"valueOfThisItem", selected:true}</code>
     *  						<code>label</code> is required.  If <code>value</code> is omitted, the <code>label</code> is returned
     *  						as the selected value.
     *  @param	width	The width in pixels. Defaults to 200.
     *  @param	rows	The number of rows to display in the viewable area.  If the <code>rows</code> is less than the number of
     * 					items in the list, scrollbars will appear.  If this parameter is omitted, the length of the Array passed
     * 					in to <code>items</code> is used.
     *  @return {XULWindow} The instance, for chaining
     */
    this.addListBox = function (id, items, width, rows) {
        var signature = "addListBox(id:String, items:Array, width:Number=NaN, rows:Number=NaN)";

        if (!id) {
            alert("XULWindow::addListBox() requires an id parameter.\n\t" + signature);
            return this;
        }

        if (!items) {
            alert("XULWindow::addListBox() requires an items parameter.\n\t" + signature);
            return this;
        }

        if (isNaN(width)) {
            width = 200;
        }
        if (isNaN(rows)) {
            rows = items.length;
        }

        this._xml += '<listbox id="' + id + '" width="' + width + '" rows="' + rows + '">\n';
        var iLen = items.length;
        var item;
        var selected;
        var value;

        for (var i = 0; i < iLen; i++) {
            item = items[i];

            if (!item.label) {
                alert("The items parameter of XULWindow::addListBox() needs to be an Array of Objects, each Object consisting of" +
                    " at least a label property, and optionally a value and a selected property.");
                return this;
            }

            value = item.value ? 'value="' + item.value + '" ' : '';
            selected = item.selected ? 'selected="' + item.selected + '" ' : '';

            this._xml += '\t<listitem ' + value + 'label="' + item.label + '" ' + selected + '/>\n';
        }

        this._xml += "</listbox>\n";
        return this;
    };

    /**
     *  Adds a basic text label.
     *  @method addLabel
     *  @param	label	The text to display in the label.
     *  @param	control	The id of the associated control.  If the user clicks on the label, focus is moved to the control. (Doesn't work?)
     *  @return {XULWindow} The instance, for chaining
     */
    this.addLabel = function (label, control, width) {
        this._xml += '<label value="' + label + '" control="' + control + '" width="' + (width || 60) + '" />\n';
        return this;
    };

    /**
     *  Adds a text box in which the user can type.
     *  @method addTextBox
     *  @param	id		The name of the property on the returned data object.
     *  @param	value	The default value contained within the text box.
     *  @return {XULWindow} The instance, for chaining
     */
    this.addTextBox = function (id, value, width) {
        this._xml += '<textbox id="' + id + '" value="' + value + '" width="' + (width || 60) + '"/>';
        return this;
    };

    /**
     *  A a popup menu
     *  @method addMenuList
     *  @param {String} id The id of the list
     *  @param {Array} items The collection of items to add
     *  @param {String|Number} [selectValue] The value to select
     *  @param {Number} [width] The width of the menu list
     *  @return {XULWindow} The instance, for chaining
     */
    this.addMenuList = function (id, items, selectValue, width) {
        this._xml += '<menulist id="' + id + '" width="' + (width || "") + '"><menupop>';
        var iLen = items.length,
            value, i, selected;
        for (i = 0; i < iLen; i++) {
            value = items[i].value ? 'value="' + items[i].value + '" ' : '';
            selected = (selectValue == items[i].value) ? selected = ' selected="true"' : '';
            this._xml += '\t<menuitem ' + value + 'label="' + items[i].label + '"' + selected + '/>\n';
        }
        this._xml += '</menupop></menulist>' + "\n";
        return this;
    };

    /**
     *  Creates a vertically-oriented group of radio buttons.
     *  @method addRadioGroup
     *  @param	id		The name of the property on the returned object with data in it.
     *  @param	items	Array of Objects specifying the buttons to display.  The Objects should take on the following form:
     * 						<code>{label:"Text to display", value:"valueOfThisButton", selected:true}</code>
     * 						<code>label</code> is required.  If <code>value</code> is omitted, the <code>label</code> is returned
     * 						as the selected value.
     *  @return {XULWindow} The instance, for chaining
     */
    this.addRadioGroup = function (id, items) {
        var signature = "addRadioGroup(id:String, items:Array)";

        if (!id) {
            alert("XULWindow::addRadioGroup() requires an id parameter.\n\t" + signature);
            return this;
        }

        if (!items) {
            alert("XULWindow::addRadioGroup() requires an items parameter.\n\t" + signature);
            return this;
        }

        this._xml += '<radiogroup id="' + id + '">\n';

        var iLen = items.length;
        var item;
        var selected;
        var value;
        for (var i = 0; i < iLen; i++) {
            item = items[i];

            if (!item.label) {
                alert("The items parameter of XULWindow::addRadioGroup() needs to be an Array of Objects, each Object consisting of" +
                    " at least a label property, and optionally a value and a selected property.");
                return this;
            }

            value = item.value ? 'value="' + item.value + '" ' : '';
            selected = item.selected ? 'selected="' + item.selected + '" ' : '';

            this._xml += '\t<radio ' + value + 'label="' + item.label + '" ' + selected + '/>\n';
        }

        this._xml += "</radiogroup>\n";

        return this;
    };
};

/**
 * Static constant alias for the name of the "accept" button.
 **/
XULWindow.__defineGetter__("ACCEPT", function () {
    return "accept";
});
/**
 * Static constant alias for the name of the "cancel" button.
 **/
XULWindow.__defineGetter__("CANCEL", function () {
    return "cancel";
});
