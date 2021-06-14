(function(){

	// Include the command library
	var dir = fl.scriptURI.split("/");
	dir = dir.slice(0,dir.length - 3).join("/");
	fl.runScript(dir + "/JSFLLibraries/Command.jsfl");

	/**
	*  Script to remove redundant keyframes from the timeline.
	*  @class OptimizeKeyframes
	*/
	var OptimizeKeyframes = function()
	{
		if (!this.getDOM()) return;

		fl.showIdleMessage(false);

		// Get the saved checks
		var settingsPath = 'Commands/Optimizing/OptimizeKeyframes.json';
		var settings = this.loadSettings(settingsPath) || {};

		/**
		*  The tolerance when comparing a,b,c,d matrix values
		*  @propety {Number} scaleTolerance
		*  @default 0.1
		*/
		this.scaleTolerance = settings.scaleTolerance || 0.01;

		/**
		*  The tolerance when comparing translation tx, ty values
		*  @propety {Number} moveTolerance
		*  @default 2.0
		*/
		this.moveTolerance = settings.moveTolerance || 1.0;

		var ui = this.dialog("Optimize Keyframes")
			.columns(2)
			.openRow()
			.openHBox()
			.addLabel('Move Tolerance', 'moveTolerance', 180)
			.addTextBox('moveTolerance', this.moveTolerance)
			.closeHBox()
			.closeRow()
			.openRow()
			.openHBox()
			.addLabel('Scale Tolerance', 'scaleTolerance', 180)
			.addTextBox('scaleTolerance', this.scaleTolerance)
			.closeHBox()
			.closeRow()
			.create();

		// Handle the cancel
		if (ui.dismiss == "cancel") return;

		// Update the settings
		this.moveTolerance = settings.moveTolerance = parseFloat(ui.moveTolerance);
		this.scaleTolerance = settings.scaleTolerance = parseFloat(ui.scaleTolerance);

		// Save the settings with the update from the dialog
		this.saveSettings(settingsPath, settings);

		// get the current timeline
		this.preprocess(this.dom.getTimeline());

		fl.showIdleMessage(true);
	};

	// Reference to the prototype
	var p = OptimizeKeyframes.prototype = new Command();

	/**
	 * First, a preprocess task will remove any tween where the keyframes
	 * are the same, this will help eliminate more cases where tweens
	 * would typically block the optimizing of keyframes
	 * @method preprocess
	 */
	p.preprocess = function(timeline)
	{
		var layers = timeline.layers;
		var i, j, frames, frame, lastKeyframe;

		for (i = 0; i < layers.length; i++)
		{
			// Select the current layer so we can remove
			// keyframes from it
			timeline.currentLayer = i;

			// The collection of frames
			frames = layers[i].frames;

			for (j = 0; j < frames.length;)
			{
				// The current keyframe
				frame = frames[j];

				// No content, skip to the next keyframe
				if (frame.isEmpty)
				{
					lastKeyframe = null;
					j += frame.duration;
					continue;
				}

				// Remove tween for frames that are one frame long
				if (frame.duration === 1 && frame.tweenType != "none")
				{
					frame.tweenType = "none";
				}

				if (lastKeyframe && // valid last keyframe
					lastKeyframe.tweenType != "none" && // previous keyframe is a tween
					this.frameCompare(lastKeyframe, frame)) // keyframes are the
				{
					// Remove the tween for keyframes that are the same
					lastKeyframe.tweenType = "none";
				}

				// Save the last invalid keyframe
				lastKeyframe = frame;

				// go to the next keyframe
				j += frame.duration;
			}

			// Clear the keyframe for each layer
			lastKeyframe = null;
		}

		// Remove the keyframes
		for (i = 0; i < layers.length; i++)
		{
			// Select the current layer so we can remove
			// keyframes from it
			timeline.currentLayer = i;

			// The collection of frames
			frames = layers[i].frames;

			for (j = 0; j < frames.length;)
			{
				// The current keyframe
				frame = frames[j];

				// For keyframes that are empty or are the start
				// of a tween, then we'll ignore and goto the next
				// keyframe
				if (frame.tweenType !== "none" || frame.isEmpty)
				{
					lastKeyframe = null;
					j += frame.duration;
					continue;
				}

				// If the frames are the same
				// then we'll remove the current keyframe
				if (lastKeyframe && this.frameCompare(lastKeyframe, frame))
				{
					timeline.clearKeyframes(j);
				}
				else
				{
					// Save the last invalid keyframe
					lastKeyframe = frame;
				}

				// go to the next keyframe
				j += frame.duration;
			}

			// Clear the keyframe for each layer
			lastKeyframe = null;
		}
	};

	/**
	*  Compare two keyframes to see if they are the same
	*  @method frameCompare
	*  @param {Frame} lastKeyframe The last keyframe to compare to
	*  @param {Frame} currKeyframe The current keyframe to compare to
	*  @return {Boolean} True if the keyframes are the same, false if not
	*/
	p.frameCompare = function(lastKeyframe, currKeyframe)
	{
		// Different element length counts, not the same
		if (lastKeyframe.elements.length != currKeyframe.elements.length)
		{
			return false;
		}

		// Loop through all the elements, they should
		// be in the same layered order to be considered the same
		// so we'll compare an element in the last keyframe
		// and a keyframe in the current keyframe
		for (var i = 0, len = lastKeyframe.elements.length; i < len; i++)
		{
			if (!this.elementCompare(lastKeyframe.elements[i], currKeyframe.elements[i]))
			{
				return false;
			}
		}
		return true;
	};

	/**
	*  Are the elements the same
	*  @method elementCompare
	*  @param {Element} element1 First element to compare
	*  @param {Element} element2 Second element to compare
	*  @return {Boolean} True if the elements are the same, false if not
	*/
	p.elementCompare = function(element1, element2)
	{
		var props;

		// The elements should be the same type
		if (element1.elementType != element2.elementType)
		{
			return false;
		}
		// Compare the positions
		else if (!this.matrixCompare(element1.matrix, element2.matrix))
		{
			return false;
		}

		// Special compare instances
		if (element1.elementType === "instance")
		{
			// Library items aren't the same
			if (element1.libraryItem !== element2.libraryItem)
			{
				return false;
			}
			// Unlikely that these are different
			else if (element1.instanceType !== element2.instanceType)
			{
				return false;
			}
			// Special checks for symbols types
			if (element1.instanceType === "symbol")
			{

				props = [
					'symbolType',
					'colorMode',
					'blendMode',
					'loop',
					'slient',
					'is3D',
					'visible',
					'firstFrame',
					'cacheAsBitmap'
				];

				if (!this.propsCompare(element1, element2, props))
				{
					return false;
				}
			}
		}
		return true;
	};

	/**
	*  Compare a list of properties
	*  @method propsCompare
	*  @param {Element} element1 First element to compare
	*  @param {Element} element2 Second element to compare
	*  @param {Array} props The collectin of properties
	*  @return {Boolean} True if the elements are the same, false if not
	*/
	p.propsCompare = function(element1, element2, props)
	{
		for (var i = 0; i < props.length; i++)
		{
			if (element1[props[i]] !== element2[props[i]])
			{
				return false;
			}
		}
		return true;
	};

	/**
	*  Method to compare two matrices
	*  @method matrixCompare
	*  @param {Matrix} matrix1 First matrix to compare
	*  @param {Matrix} matrix2 Second matrix to compare
	*  @return {Boolean} If the matrices are the same
	*/
	p.matrixCompare = function(matrix1, matrix2)
	{
		return Math.abs(matrix1.a - matrix2.a) <= this.scaleTolerance &&
			Math.abs(matrix1.b - matrix2.b) <= this.scaleTolerance &&
			Math.abs(matrix1.c - matrix2.c) <= this.scaleTolerance &&
			Math.abs(matrix1.d - matrix2.d) <= this.scaleTolerance &&
			Math.abs(matrix1.tx - matrix2.tx) <= this.moveTolerance &&
			Math.abs(matrix1.ty - matrix2.ty) <= this.moveTolerance;
	};

	new OptimizeKeyframes();

}());