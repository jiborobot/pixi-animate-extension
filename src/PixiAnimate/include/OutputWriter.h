//
//  OutputWriter.hpp
//  PixiAnimate.mp
//
//  Created by Matt Bittarelli on 11/24/15.
//
//

#ifndef JSON_OUTPUT_WRITER_H_
#define JSON_OUTPUT_WRITER_H_

#include "Version.h"
#include "FCMTypes.h"
#include "IOutputWriter.h"
#include "Utils.h"
#include <string>
#include <vector>
#include <map>

#define MAX_RETRY_ATTEMPT               10

class JSONNode;

namespace PixiJS
{
	class OutputWriter : public IOutputWriter
	{
	public:

		// Marks the begining of the Document
		virtual FCM::Result StartDocument(const DOM::Utils::COLOR& background,
			FCM::U_Int32 stageHeight,
			FCM::U_Int32 stageWidth,
			FCM::U_Int32 fps);

		virtual void AddTweens(JSONNode* tweens);

		// Marks the end of the Document
		virtual FCM::Result EndDocument();

		// Marks the start of a timeline
		virtual FCM::Result StartDefineTimeline();

		// Marks the end of a timeline
		virtual FCM::Result EndDefineTimeline(
			FCM::U_Int32 resId,
			FCM::StringRep16 pName,
			ITimelineWriter* pTimelineWriter);

		// Marks the start of a shape
		virtual FCM::Result StartDefineShape();

		// Start of fill region definition
		virtual FCM::Result StartDefineFill();

		// Solid fill style definition
		virtual FCM::Result DefineSolidFillStyle(const DOM::Utils::COLOR& color);

		// Bitmap fill style definition
		virtual FCM::Result DefineBitmapFillStyle(
			FCM::Boolean clipped,
			const DOM::Utils::MATRIX2D& matrix,
			FCM::S_Int32 height,
			FCM::S_Int32 width,
			const std::string& libPathName,
			DOM::LibraryItem::PIMediaItem pMediaItem);

		// Start Linear Gradient fill style definition
		virtual FCM::Result StartDefineLinearGradientFillStyle(
			DOM::FillStyle::GradientSpread spread,
			const DOM::Utils::MATRIX2D& matrix);

		// Sets a specific key point in a color ramp (for both radial and linear gradient)
		virtual FCM::Result SetKeyColorPoint(
			const DOM::Utils::GRADIENT_COLOR_POINT& colorPoint);

		// End Linear Gradient fill style definition
		virtual FCM::Result EndDefineLinearGradientFillStyle();

		// Start Radial Gradient fill style definition
		virtual FCM::Result StartDefineRadialGradientFillStyle(
			DOM::FillStyle::GradientSpread spread,
			const DOM::Utils::MATRIX2D& matrix,
			FCM::S_Int32 focalPoint);

		// End Radial Gradient fill style definition
		virtual FCM::Result EndDefineRadialGradientFillStyle();

		// Start of fill region boundary
		virtual FCM::Result StartDefineBoundary();

		// Sets a segment of a path (Used for boundary, holes)
		virtual FCM::Result SetSegment(const DOM::Utils::SEGMENT& segment);

		// End of fill region boundary
		virtual FCM::Result EndDefineBoundary();

		// Start of fill region hole
		virtual FCM::Result StartDefineHole();

		// End of fill region hole
		virtual FCM::Result EndDefineHole();

		// Start of stroke group
		virtual FCM::Result StartDefineStrokeGroup();

		// Start solid stroke style definition
		virtual FCM::Result StartDefineSolidStrokeStyle(
			FCM::Double thickness,
			const DOM::StrokeStyle::JOIN_STYLE& joinStyle,
			const DOM::StrokeStyle::CAP_STYLE& capStyle,
			DOM::Utils::ScaleType scaleType,
			FCM::Boolean strokeHinting);

		// End of solid stroke style
		virtual FCM::Result EndDefineSolidStrokeStyle();

		// Start of stroke
		virtual FCM::Result StartDefineStroke();

		// End of a stroke
		virtual FCM::Result EndDefineStroke();

		// End of stroke group
		virtual FCM::Result EndDefineStrokeGroup();

		// End of fill style definition
		virtual FCM::Result EndDefineFill();

		// Marks the end of a shape
		virtual FCM::Result EndDefineShape(FCM::U_Int32 resId);

		// Define a bitmap
		virtual FCM::Result DefineBitmap(
			FCM::U_Int32 resId,
			FCM::S_Int32 height,
			FCM::S_Int32 width,
			const std::string& libPathName,
			DOM::LibraryItem::PIMediaItem pMediaItem);

		// Start of a classic text definition
		virtual FCM::Result StartDefineClassicText(
			FCM::U_Int32 resId,
			const DOM::FrameElement::AA_MODE_PROP& aaModeProp,
			const std::string& displayText,
			const TEXT_BEHAVIOUR& textBehaviour);

		// Start paragraph
		virtual FCM::Result StartDefineParagraph(
			FCM::U_Int32 startIndex,
			FCM::U_Int32 length,
			const DOM::FrameElement::PARAGRAPH_STYLE& paragraphStyle);

		// Start text run
		virtual FCM::Result StartDefineTextRun(
			FCM::U_Int32 startIndex,
			FCM::U_Int32 length,
			const TEXT_STYLE& textStyle);

		// End of a text run
		virtual FCM::Result EndDefineTextRun();

		// End of a paragraph
		virtual FCM::Result EndDefineParagraph();

		// End of a classic text definition
		virtual FCM::Result EndDefineClassicText();

		virtual FCM::Result DefineSound(
			FCM::U_Int32 resId,
			const std::string& libPathName,
			DOM::LibraryItem::PIMediaItem pMediaItem);

		OutputWriter(
			FCM::PIFCMCallback pCallback,
			std::string &basePath,
			std::string &outputFile,
			std::string &imagesPath,
			std::string &soundsPath,
			std::string &htmlPath,
			std::string &libsPath,
			std::string &stageName,
			std::string &nameSpace,
			std::string &outputVersion,
			std::string &outputFormat,
			bool html,
			bool libs,
			bool images,
			bool sounds,
			bool compactShapes,
			bool compressJS,
			bool loopTimeline,
			bool spritesheets,
			int spritesheetSize,
			double spritesheetScale);

		virtual ~OutputWriter();

		// Start of a path
		virtual FCM::Result StartDefinePath();

		// End of a path
		virtual FCM::Result EndDefinePath();

		// Start a preview for the output content for this writer
		virtual FCM::Result StartPreview(FCM::PIFCMCallback pCallback);

		// Stop a preview for the output content for this writer
		virtual FCM::Result StopPreview();

	private:

		FCM::Boolean GetImageExportFileName(const std::string& libPathName, std::string& name);

		void SetImageExportFileName(const std::string& libPathName, const std::string& name);

		void Save(const std::string &filePath, const std::string &content);

		bool SaveFromTemplate(const std::string &templatePath, const std::string &outputPath);

		JSONNode* m_pRootNode;

		JSONNode* m_pShapeArray;

		JSONNode* m_pTimelineArray;

		JSONNode* m_pBitmapArray;

		JSONNode* m_pSoundArray;

		JSONNode* m_pTextArray;

		JSONNode* m_pTweenArray;

		JSONNode*  m_shapeElem;

		JSONNode*  m_pathArray;

		JSONNode*  m_pathElem;

		JSONNode*  m_pTextElem;

		JSONNode*  m_pTextParaArray;

		JSONNode*  m_pTextPara;

		JSONNode*  m_pTextRunArray;

		JSONNode*  m_gradientColor;

		JSONNode*  m_stopPointArray;

		JSONNode*  m_pathCmdArray;

		bool       m_firstSegment;

		FCM::U_Int32 m_framerate;

		FCM::U_Int32 m_stageHeight;

		FCM::U_Int32 m_stageWidth;

		std::string m_background;

		STROKE_STYLE m_strokeStyle;

		FCM::PIFCMCallback m_pCallback;

		std::map<std::string, std::string> m_imageMap;

		FCM::U_Int32 m_symbolNameLabel;

		FCM::Boolean m_imageFolderCreated;

		FCM::Boolean m_soundFolderCreated;

		std::string m_basePath;

		std::string m_imagesPath;

		std::string m_soundsPath;

		std::string m_htmlPath;

		std::string m_libsPath;

		std::string m_stageName;

		std::string m_nameSpace;

		std::string m_outputFile;

		std::string m_outputVersion;

		std::string m_outputFormat;

		std::string m_outputDataFile;

		std::string m_outputImageFolder;

		std::string m_outputSoundFolder;

		std::map<std::string, std::string> m_substitutions;

		int m_spritesheetSize;

		double m_spritesheetScale;

		bool m_spritesheets;

		bool m_html;

		bool m_libs;

		bool m_images;

		bool m_sounds;

		bool m_compactShapes;

		bool m_compressJS;

		bool m_loopTimeline;
	};
};

#endif /* JSON_OUTPUT_WRITER_H_ */
