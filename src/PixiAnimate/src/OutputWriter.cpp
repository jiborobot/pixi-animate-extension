//
//  OutputWriter.cpp
//  PixiAnimate.mp
//
//  Created by Matt Bittarelli on 11/24/15.
//
//

#include "OutputWriter.h"

/*************************************************************************
 * ADOBE CONFIDENTIAL
 * ___________________
 *
 *  Copyright [2013] Adobe Systems Incorporated
 *  All Rights Reserved.
 *
 * NOTICE:  All information contained herein is, and remains
 * the property of Adobe Systems Incorporated and its suppliers,
 * if any.  The intellectual and technical concepts contained
 * herein are proprietary to Adobe Systems Incorporated and its
 * suppliers and are protected by all applicable intellectual
 * property laws, including trade secret and copyright laws.
 * Dissemination of this information or reproduction of this material
 * is strictly forbidden unless prior written permission is obtained
 * from Adobe Systems Incorporated.
 **************************************************************************/

#include "OutputWriter.h"
#include "PluginConfiguration.h"

#include <cstring>
#include <fstream>
#include <map>
#include <iostream>
#include <sstream>
#include <string>
#include <iterator>

#include "FlashFCMPublicIDs.h"
#include "FCMPluginInterface.h"
#include "libjson.h"
#include "Utils.h"
#include "FrameElement/ISound.h"
#include "Service/Image/IBitmapExportService.h"
#include "Service/TextLayout/ITextLinesGeneratorService.h"
#include "Service/TextLayout/ITextLine.h"
#include "Service/Sound/ISoundExportService.h"
#include "GraphicFilter/IDropShadowFilter.h"
#include "GraphicFilter/IAdjustColorFilter.h"
#include "GraphicFilter/IBevelFilter.h"
#include "GraphicFilter/IBlurFilter.h"
#include "GraphicFilter/IGlowFilter.h"
#include "GraphicFilter/IGradientBevelFilter.h"
#include "GraphicFilter/IGradientGlowFilter.h"
#include "Utils/ILinearColorGradient.h"
#include <math.h>
#include "TimelineWriter.h"

#ifdef _WINDOWS
#include <experimental\filesystem>
namespace fs = std::experimental::filesystem;
#include "Windows.h"
#endif

namespace PixiJS
{
	// Keys for render to graphics
	static const std::string moveTo = "m";
	static const std::string lineTo = "l";
	static const std::string quadraticCurveTo = "q";
	static const std::string closePath = "cp";
	static const std::string beginHole = "bh";
	static const std::string endHole = "eh";

	// Template
	static const std::string html = "index.html";
	static const std::string htmlDebug = "index-debug.html";
	static const std::string htmlLegacy = "index-legacy.html";
	static const std::string htmlDebugLegacy = "index-debug-legacy.html";

	static const FCM::Float GRADIENT_VECTOR_CONSTANT = 16384.0;

	/* -------------------------------------------------- OutputWriter */

	FCM::Result OutputWriter::StartDocument(const DOM::Utils::COLOR& background,
		FCM::U_Int32 stageHeight,
		FCM::U_Int32 stageWidth,
		FCM::U_Int32 fps)
	{

		FCM::U_Int32 backColor = (background.red << 16) | (background.green << 8) | (background.blue);

		// Convert the backColor INT to a hex string e.g., ffffff
		std::stringstream sstream;
		sstream << std::hex << backColor;

		std::string outputName;
		Utils::GetFileNameWithoutExtension(m_outputFile, outputName);

		// Template substitutions are created e.g., ${imagesPath} replaced with path to images
		m_substitutions["imagesPath"] = m_imagesPath;
		m_substitutions["libsPath"] = m_libsPath;
		m_substitutions["soundsPath"] = m_soundsPath;
		m_substitutions["htmlPath"] = m_htmlPath;
		m_substitutions["outputFile"] = m_outputFile;
		m_substitutions["outputName"] = outputName;
		m_substitutions["stageName"] = m_stageName;
		m_substitutions["width"] = Utils::ToString(stageWidth);
		m_substitutions["height"] = Utils::ToString(stageHeight);
		m_substitutions["background"] = sstream.str();
		m_substitutions["fps"] = Utils::ToString(fps);
		m_substitutions["nameSpace"] = m_nameSpace;

		m_framerate = fps;
		m_stageWidth = stageWidth;
		m_stageHeight = stageHeight;
		m_background = sstream.str();

		return FCM_SUCCESS;
	}

	void OutputWriter::AddTweens(JSONNode* tweens)
	{
		m_pTweenArray = tweens;
	}

	FCM::Result OutputWriter::EndDocument()
	{
		m_pRootNode->push_back(*m_pShapeArray);
		m_pRootNode->push_back(*m_pBitmapArray);
		m_pRootNode->push_back(*m_pSoundArray);
		m_pRootNode->push_back(*m_pTextArray);
		m_pRootNode->push_back(*m_pTimelineArray);
		if (m_pTweenArray != NULL)
		{
			m_pRootNode->push_back(*m_pTweenArray);
		}

		JSONNode meta(JSON_NODE);
		meta.set_name("_meta");
		meta.push_back(JSONNode("outputFile", m_outputFile));
		meta.push_back(JSONNode("outputVersion", m_outputVersion));
		meta.push_back(JSONNode("outputFormat", m_outputFormat));
		meta.push_back(JSONNode("stageName", m_stageName));
		meta.push_back(JSONNode("compressJS", m_compressJS));
		meta.push_back(JSONNode("compactShapes", m_compactShapes));
		meta.push_back(JSONNode("nameSpace", m_nameSpace));
		meta.push_back(JSONNode("loopTimeline", m_loopTimeline));
		meta.push_back(JSONNode("framerate", m_framerate));
		meta.push_back(JSONNode("background", m_background));
		meta.push_back(JSONNode("width", m_stageWidth));
		meta.push_back(JSONNode("height", m_stageHeight));

		if (m_images)
		{
			meta.push_back(JSONNode("imagesPath", m_imagesPath));
			meta.push_back(JSONNode("spritesheets", m_spritesheets));
			meta.push_back(JSONNode("spritesheetSize", m_spritesheetSize));
			meta.push_back(JSONNode("spritesheetScale", m_spritesheetScale));
		}

		if (m_html)
		{
			meta.push_back(JSONNode("htmlPath", m_htmlPath));
		}

		if (m_sounds)
		{
			meta.push_back(JSONNode("soundsPath", m_soundsPath));
		}

		std::string major = Utils::ToString(PIXIJS_PLUGIN_VERSION_MAJOR);
		std::string minor = Utils::ToString(PIXIJS_PLUGIN_VERSION_MINOR);
		std::string patch = Utils::ToString(PIXIJS_PLUGIN_VERSION_MAINTENANCE);

		meta.push_back(JSONNode("version", (major)+"." + (minor)+"." + (patch)));
		m_pRootNode->push_back(meta);

		// Write the JSON file (overwrite file if it already exists)
#ifdef _DEBUG
	// If we're in DEBUG mode, write the well-formated JSON with whitespace
		Save(m_outputDataFile, m_pRootNode->write_formatted());
#else
	// JSON with no whitespace
		Save(m_outputDataFile, m_pRootNode->write());
#endif

		std::string extensionPath;
		Utils::GetExtensionPath(extensionPath, m_pCallback);
		std::string compiler = extensionPath + NODE_COMPILER;
		std::string publish = "\"" + compiler + "\" --src \"" + m_outputDataFile + "\"";

#ifdef _DEBUG
		publish += " --debug";
#endif
		Utils::RunElectron(publish);

		// Output the HTML templates
		if (m_html)
		{
			if (m_outputVersion == "1.0")
			{
				if (m_compressJS)
				{
					SaveFromTemplate(htmlLegacy, m_htmlPath);
				}
				else
				{
					SaveFromTemplate(htmlDebugLegacy, m_htmlPath);
				}
			}
			else
			{
				if (m_compressJS)
				{
					SaveFromTemplate(html, m_htmlPath);
				}
				else
				{
					SaveFromTemplate(htmlDebug, m_htmlPath);
				}
			}
		}

		return FCM_SUCCESS;
	}


	FCM::Result OutputWriter::StartDefineTimeline()
	{
		return FCM_SUCCESS;
	}


	FCM::Result OutputWriter::EndDefineTimeline(
		FCM::U_Int32 resId,
		FCM::StringRep16 pName,
		ITimelineWriter* pTimelineWriter)
	{
		TimelineWriter* pWriter = static_cast<TimelineWriter*> (pTimelineWriter);

		std::string timelineName(m_stageName);
		if (resId != 0)
		{
			if (pName)
			{
				timelineName = Utils::ToString(pName, m_pCallback);
				Utils::GetJavaScriptName(timelineName, timelineName);
			}
			else
			{
				// This is temporary until the pName works on getting the name
				m_symbolNameLabel++;
				timelineName = "Graphic" + Utils::ToString(m_symbolNameLabel);
			}
		}

		pWriter->Finish(resId, pName, timelineName);

		m_pTimelineArray->push_back(*(pWriter->GetRoot()));

		return FCM_SUCCESS;
	}

	FCM::Result OutputWriter::StartDefineShape()
	{
		m_shapeElem = new JSONNode(JSON_NODE);
		ASSERT(m_shapeElem);

		m_pathArray = new JSONNode(JSON_ARRAY);
		ASSERT(m_pathArray);
		m_pathArray->set_name("paths");

		return FCM_SUCCESS;
	}


	// Marks the end of a shape
	FCM::Result OutputWriter::EndDefineShape(FCM::U_Int32 resId)
	{
		m_shapeElem->push_back(JSONNode("assetId", resId));
		m_shapeElem->push_back(*m_pathArray);

		m_pShapeArray->push_back(*m_shapeElem);

		delete m_pathArray;
		delete m_shapeElem;

		return FCM_SUCCESS;
	}


	// Start of fill region definition
	FCM::Result OutputWriter::StartDefineFill()
	{
		m_pathElem = new JSONNode(JSON_NODE);
		ASSERT(m_pathElem);

		m_pathCmdArray = new JSONNode(JSON_ARRAY);
		ASSERT(m_pathCmdArray);
		m_pathCmdArray->set_name("d");

		return FCM_SUCCESS;
	}


	// Solid fill style definition
	FCM::Result OutputWriter::DefineSolidFillStyle(const DOM::Utils::COLOR& color)
	{
		std::string colorStr = Utils::ToString(color);
		m_pathElem->push_back(JSONNode("color", colorStr.c_str()));
		m_pathElem->push_back(JSONNode("alpha", (float)(color.alpha / 255.0)));

		return FCM_SUCCESS;
	}


	// Bitmap fill style definition
	FCM::Result OutputWriter::DefineBitmapFillStyle(
		FCM::Boolean clipped,
		const DOM::Utils::MATRIX2D& matrix,
		FCM::S_Int32 height,
		FCM::S_Int32 width,
		const std::string& libPathName,
		DOM::LibraryItem::PIMediaItem pMediaItem)
	{
		FCM::Result res;
		std::string name;
		std::string ext;
		JSONNode bitmapElem(JSON_NODE);

		bitmapElem.set_name("image");

		bitmapElem.push_back(JSONNode("height", height));
		bitmapElem.push_back(JSONNode("width", width));

		FCM::AutoPtr<FCM::IFCMUnknown> pUnk;

		FCM::Boolean alreadyExported = GetImageExportFileName(libPathName, name);
		if (!alreadyExported)
		{
			if (m_images && !m_imageFolderCreated)
			{
				res = Utils::CreateDir(m_outputImageFolder, m_pCallback);
				if (!(FCM_SUCCESS_CODE(res)))
				{
					Utils::Trace(m_pCallback, "Output image folder (%s) could not be created\n", m_outputImageFolder.c_str());
					return res;
				}
				m_imageFolderCreated = true;
			}
			Utils::GetFileExtension(libPathName, ext);
			Utils::GetFileNameWithoutExtension(libPathName, name);
			SetImageExportFileName(libPathName, name);

			if (ext == "")
			{
				ext = "png";
			}
		}

		std::string bitmapExportPath(m_outputImageFolder + name + "." + ext);
		std::string bitmapRelPath(m_imagesPath + name + "." + ext);

		res = m_pCallback->GetService(DOM::FLA_BITMAP_SERVICE, pUnk.m_Ptr);
		ASSERT(FCM_SUCCESS_CODE(res));

		FCM::AutoPtr<DOM::Service::Image::IBitmapExportService> bitmapExportService = pUnk;
		if (m_images && bitmapExportService)
		{
			FCM::AutoPtr<FCM::IFCMCalloc> pCalloc;
#ifdef _WINDOWS
			fs::path exportPath(bitmapExportPath);
			FCM::StringRep16 pFilePath = Utils::ToString16(fs::canonical(exportPath).string(), m_pCallback);
#else
			FCM::StringRep16 pFilePath = Utils::ToString16(bitmapExportPath, m_pCallback);
#endif
			res = bitmapExportService->ExportToFile(pMediaItem, pFilePath, 100);
			ASSERT(FCM_SUCCESS_CODE(res));

			pCalloc = Utils::GetCallocService(m_pCallback);
			ASSERT(pCalloc.m_Ptr != NULL);

			pCalloc->Free(pFilePath);
		}

		bitmapElem.push_back(JSONNode("src", bitmapRelPath));
		bitmapElem.push_back(JSONNode("name", name));

		DOM::Utils::MATRIX2D matrix1 = matrix;
		matrix1.a /= 20.0;
		matrix1.b /= 20.0;
		matrix1.c /= 20.0;
		matrix1.d /= 20.0;

		bitmapElem.push_back(JSONNode("patternUnits", "userSpaceOnUse"));
		bitmapElem.push_back(Utils::ToJSON("patternTransform", matrix1));

		m_pathElem->push_back(bitmapElem);

		return FCM_SUCCESS;
	}


	// Start Linear Gradient fill style definition
	FCM::Result OutputWriter::StartDefineLinearGradientFillStyle(
		DOM::FillStyle::GradientSpread spread,
		const DOM::Utils::MATRIX2D& matrix)
	{
		DOM::Utils::POINT2D point;

		m_gradientColor = new JSONNode(JSON_NODE);
		ASSERT(m_gradientColor);
		m_gradientColor->set_name("linearGradient");

		point.x = -GRADIENT_VECTOR_CONSTANT / 20;
		point.y = 0;
		Utils::TransformPoint(matrix, point, point);

		m_gradientColor->push_back(JSONNode("x1", point.x));
		m_gradientColor->push_back(JSONNode("y1", point.y));

		point.x = GRADIENT_VECTOR_CONSTANT / 20;
		point.y = 0;
		Utils::TransformPoint(matrix, point, point);

		m_gradientColor->push_back(JSONNode("x2", point.x));
		m_gradientColor->push_back(JSONNode("y2", point.y));

		m_gradientColor->push_back(JSONNode("spreadMethod", Utils::ToString(spread)));

		m_stopPointArray = new JSONNode(JSON_ARRAY);
		ASSERT(m_stopPointArray);
		m_stopPointArray->set_name("stop");

		return FCM_SUCCESS;
	}


	// Sets a specific key point in a color ramp (for both radial and linear gradient)
	FCM::Result OutputWriter::SetKeyColorPoint(
		const DOM::Utils::GRADIENT_COLOR_POINT& colorPoint)
	{
		JSONNode stopEntry(JSON_NODE);
		FCM::Float offset;

		offset = (float)((colorPoint.pos * 100) / 255.0);

		stopEntry.push_back(JSONNode("offset", offset));
		stopEntry.push_back(JSONNode("stopColor", Utils::ToString(colorPoint.color)));
		stopEntry.push_back(JSONNode("stopOpacity", (float)(colorPoint.color.alpha / 255.0)));

		m_stopPointArray->push_back(stopEntry);

		return FCM_SUCCESS;
	}


	// End Linear Gradient fill style definition
	FCM::Result OutputWriter::EndDefineLinearGradientFillStyle()
	{
		m_gradientColor->push_back(*m_stopPointArray);
		m_pathElem->push_back(*m_gradientColor);

		delete m_stopPointArray;
		delete m_gradientColor;

		return FCM_SUCCESS;
	}


	// Start Radial Gradient fill style definition
	FCM::Result OutputWriter::StartDefineRadialGradientFillStyle(
		DOM::FillStyle::GradientSpread spread,
		const DOM::Utils::MATRIX2D& matrix,
		FCM::S_Int32 focalPoint)
	{
		DOM::Utils::POINT2D point;
		DOM::Utils::POINT2D point1;
		DOM::Utils::POINT2D point2;

		m_gradientColor = new JSONNode(JSON_NODE);
		ASSERT(m_gradientColor);
		m_gradientColor->set_name("radialGradient");

		point.x = 0;
		point.y = 0;
		Utils::TransformPoint(matrix, point, point1);

		point.x = GRADIENT_VECTOR_CONSTANT / 20;
		point.y = 0;
		Utils::TransformPoint(matrix, point, point2);

		FCM::Float xd = point1.x - point2.x;
		FCM::Float yd = point1.y - point2.y;
		FCM::Float r = sqrt(xd * xd + yd * yd);

		FCM::Float angle = atan2(yd, xd);
		float focusPointRatio = focalPoint / (float)255.0;
		float fx = -r * focusPointRatio * cos(angle);
		float fy = -r * focusPointRatio * sin(angle);

		m_gradientColor->push_back(JSONNode("cx", 0));
		m_gradientColor->push_back(JSONNode("cy", 0));
		m_gradientColor->push_back(JSONNode("r", (float)r));
		m_gradientColor->push_back(JSONNode("fx", (float)fx));
		m_gradientColor->push_back(JSONNode("fy", (float)fy));

		FCM::Float scaleFactor = (GRADIENT_VECTOR_CONSTANT / 20) / r;
		DOM::Utils::MATRIX2D matrix1 = {};
		matrix1.a = matrix.a * scaleFactor;
		matrix1.b = matrix.b * scaleFactor;
		matrix1.c = matrix.c * scaleFactor;
		matrix1.d = matrix.d * scaleFactor;
		matrix1.tx = matrix.tx;
		matrix1.ty = matrix.ty;

		m_gradientColor->push_back(JSONNode(Utils::ToJSON("gradientTransform", matrix1)));
		m_gradientColor->push_back(JSONNode("spreadMethod", Utils::ToString(spread)));

		m_stopPointArray = new JSONNode(JSON_ARRAY);
		ASSERT(m_stopPointArray);
		m_stopPointArray->set_name("stop");

		return FCM_SUCCESS;
	}


	// End Radial Gradient fill style definition
	FCM::Result OutputWriter::EndDefineRadialGradientFillStyle()
	{
		m_gradientColor->push_back(*m_stopPointArray);
		m_pathElem->push_back(*m_gradientColor);

		delete m_stopPointArray;
		delete m_gradientColor;

		return FCM_SUCCESS;
	}

	FCM::Result OutputWriter::StartDefinePath()
	{
		// m_pathCmdArray->push_back(JSONNode("", "startPath"));
		m_pathCmdArray->push_back(JSONNode("", moveTo));
		m_firstSegment = true;
		return FCM_SUCCESS;
	}

	FCM::Result OutputWriter::EndDefinePath()
	{
		m_pathCmdArray->push_back(JSONNode("", closePath));
		// m_pathCmdArray->push_back(JSONNode("", "endPath"));
		return FCM_SUCCESS;
	}

	// Start of fill region boundary
	FCM::Result OutputWriter::StartDefineBoundary()
	{
		return StartDefinePath();
	}

	// End of fill region boundary
	FCM::Result OutputWriter::EndDefineBoundary()
	{
		// return EndDefinePath();
		return FCM_SUCCESS;
	}

	// Start of fill region hole
	FCM::Result OutputWriter::StartDefineHole()
	{
		m_pathCmdArray->push_back(JSONNode("", beginHole));
		return StartDefinePath();
	}

	// End of fill region hole
	FCM::Result OutputWriter::EndDefineHole()
	{
		m_pathCmdArray->push_back(JSONNode("", endHole));
		return FCM_SUCCESS;
	}


	// Sets a segment of a path (Used for boundary, holes)
	FCM::Result OutputWriter::SetSegment(const DOM::Utils::SEGMENT& segment)
	{
		if (m_firstSegment)
		{
			if (segment.segmentType == DOM::Utils::LINE_SEGMENT)
			{
				m_pathCmdArray->push_back(JSONNode("", (double)(segment.line.endPoint1.x)));
				m_pathCmdArray->push_back(JSONNode("", (double)(segment.line.endPoint1.y)));
			}
			else
			{
				m_pathCmdArray->push_back(JSONNode("", (double)(segment.quadBezierCurve.anchor1.x)));
				m_pathCmdArray->push_back(JSONNode("", (double)(segment.quadBezierCurve.anchor1.y)));
			}
			m_firstSegment = false;
		}

		if (segment.segmentType == DOM::Utils::LINE_SEGMENT)
		{
			m_pathCmdArray->push_back(JSONNode("", lineTo));
			m_pathCmdArray->push_back(JSONNode("", (double)(segment.line.endPoint2.x)));
			m_pathCmdArray->push_back(JSONNode("", (double)(segment.line.endPoint2.y)));
		}
		else
		{
			m_pathCmdArray->push_back(JSONNode("", quadraticCurveTo));
			m_pathCmdArray->push_back(JSONNode("", (double)(segment.quadBezierCurve.control.x)));
			m_pathCmdArray->push_back(JSONNode("", (double)(segment.quadBezierCurve.control.y)));
			m_pathCmdArray->push_back(JSONNode("", (double)(segment.quadBezierCurve.anchor2.x)));
			m_pathCmdArray->push_back(JSONNode("", (double)(segment.quadBezierCurve.anchor2.y)));
		}

		return FCM_SUCCESS;
	}

	// Start of stroke group
	FCM::Result OutputWriter::StartDefineStrokeGroup()
	{
		// No need to do anything
		return FCM_SUCCESS;
	}

	// Start solid stroke style definition
	FCM::Result OutputWriter::StartDefineSolidStrokeStyle(
		FCM::Double thickness,
		const DOM::StrokeStyle::JOIN_STYLE& joinStyle,
		const DOM::StrokeStyle::CAP_STYLE& capStyle,
		DOM::Utils::ScaleType scaleType,
		FCM::Boolean strokeHinting)
	{
		m_strokeStyle.type = SOLID_STROKE_STYLE_TYPE;
		m_strokeStyle.solidStrokeStyle.capStyle = capStyle;
		m_strokeStyle.solidStrokeStyle.joinStyle = joinStyle;
		m_strokeStyle.solidStrokeStyle.thickness = thickness;
		m_strokeStyle.solidStrokeStyle.scaleType = scaleType;
		m_strokeStyle.solidStrokeStyle.strokeHinting = strokeHinting;

		return FCM_SUCCESS;
	}


	// End of solid stroke style
	FCM::Result OutputWriter::EndDefineSolidStrokeStyle()
	{
		// No need to do anything
		return FCM_SUCCESS;
	}


	// Start of stroke
	FCM::Result OutputWriter::StartDefineStroke()
	{
		m_pathElem = new JSONNode(JSON_NODE);
		ASSERT(m_pathElem);

		m_pathCmdArray = new JSONNode(JSON_ARRAY);
		ASSERT(m_pathCmdArray);
		m_pathCmdArray->set_name("d");

		return StartDefinePath();
	}


	// End of a stroke
	FCM::Result OutputWriter::EndDefineStroke()
	{
		m_pathElem->push_back(*m_pathCmdArray);

		if (m_strokeStyle.type == SOLID_STROKE_STYLE_TYPE)
		{
			m_pathElem->push_back(JSONNode("thickness",
				(double)m_strokeStyle.solidStrokeStyle.thickness));
			m_pathElem->push_back(JSONNode("linecap",
				Utils::ToString(m_strokeStyle.solidStrokeStyle.capStyle.type).c_str()));
			m_pathElem->push_back(JSONNode("linejoin",
				Utils::ToString(m_strokeStyle.solidStrokeStyle.joinStyle.type).c_str()));

			if (m_strokeStyle.solidStrokeStyle.joinStyle.type == DOM::Utils::MITER_JOIN)
			{
				m_pathElem->push_back(JSONNode("miterLimit",
					(double)m_strokeStyle.solidStrokeStyle.joinStyle.miterJoinProp.miterLimit));
			}
			m_pathElem->push_back(JSONNode("stroke", true));
		}
		m_pathArray->push_back(*m_pathElem);

		delete m_pathElem;
		delete m_pathCmdArray;

		m_pathElem = NULL;
		m_pathCmdArray = NULL;

		return FCM_SUCCESS;
	}


	// End of stroke group
	FCM::Result OutputWriter::EndDefineStrokeGroup()
	{
		// No need to do anything
		return FCM_SUCCESS;
	}


	// End of fill style definition
	FCM::Result OutputWriter::EndDefineFill()
	{
		EndDefinePath();

		m_pathElem->push_back(*m_pathCmdArray);
		m_pathElem->push_back(JSONNode("stroke", false));

		m_pathArray->push_back(*m_pathElem);

		delete m_pathElem;
		delete m_pathCmdArray;

		m_pathElem = NULL;
		m_pathCmdArray = NULL;

		return FCM_SUCCESS;
	}


	// Define a bitmap
	FCM::Result OutputWriter::DefineBitmap(
		FCM::U_Int32 resId,
		FCM::S_Int32 height,
		FCM::S_Int32 width,
		const std::string& libPathName,
		DOM::LibraryItem::PIMediaItem pMediaItem)
	{
		FCM::Result res;
		JSONNode bitmapElem(JSON_NODE);
		std::string name;
		std::string ext;

		bitmapElem.set_name("image");

		bitmapElem.push_back(JSONNode("assetId", resId));
		bitmapElem.push_back(JSONNode("height", height));
		bitmapElem.push_back(JSONNode("width", width));

		FCM::AutoPtr<FCM::IFCMUnknown> pUnk;

		FCM::Boolean alreadyExported = GetImageExportFileName(libPathName, name);

		if (!alreadyExported)
		{
			if (m_images && !m_imageFolderCreated)
			{
				res = Utils::CreateDir(m_outputImageFolder, m_pCallback);
				if (!(FCM_SUCCESS_CODE(res)))
				{
					Utils::Trace(m_pCallback, "ERROR: Output image folder (%s) could not be created\n", m_outputImageFolder.c_str());
					return res;
				}
				m_imageFolderCreated = true;
			}
			Utils::GetFileExtension(libPathName, ext);
			Utils::GetFileNameWithoutExtension(libPathName, name);
			SetImageExportFileName(libPathName, name);

			if (ext == "")
			{
				ext = "png";
			}
		}

		std::string bitmapExportPath(m_outputImageFolder + name + "." + ext);
		std::string bitmapRelPath(m_imagesPath + name + "." + ext);

		res = m_pCallback->GetService(DOM::FLA_BITMAP_SERVICE, pUnk.m_Ptr);
		ASSERT(FCM_SUCCESS_CODE(res));

		FCM::AutoPtr<DOM::Service::Image::IBitmapExportService> bitmapExportService = pUnk;
		if (m_images && bitmapExportService)
		{
			FCM::AutoPtr<FCM::IFCMCalloc> pCalloc;
#ifdef _WINDOWS
			fs::path exportPath(bitmapExportPath);
			FCM::StringRep16 pFilePath = Utils::ToString16(fs::canonical(exportPath).string(), m_pCallback);
#else
			FCM::StringRep16 pFilePath = Utils::ToString16(bitmapExportPath, m_pCallback);
#endif
			res = bitmapExportService->ExportToFile(pMediaItem, pFilePath, 100);
			ASSERT(FCM_SUCCESS_CODE(res));

			pCalloc = Utils::GetCallocService(m_pCallback);
			ASSERT(pCalloc.m_Ptr != NULL);

			pCalloc->Free(pFilePath);
		}

		bitmapElem.push_back(JSONNode("src", bitmapRelPath));
		bitmapElem.push_back(JSONNode("name", name));

		m_pBitmapArray->push_back(bitmapElem);

		return FCM_SUCCESS;
	}


	FCM::Result OutputWriter::StartDefineClassicText(
		FCM::U_Int32 resId,
		const DOM::FrameElement::AA_MODE_PROP& aaModeProp,
		const std::string& displayText,
		const TEXT_BEHAVIOUR& textBehaviour)
	{
		JSONNode aaMode(JSON_NODE);
		JSONNode behaviour(JSON_NODE);

		m_pTextElem = new JSONNode(JSON_NODE);
		ASSERT(m_pTextElem != NULL);

		m_pTextElem->set_name("text");
		m_pTextElem->push_back(JSONNode("assetId", resId));

		aaMode.set_name("aaMode");
		aaMode.push_back(JSONNode("mode", Utils::ToString(aaModeProp.aaMode)));
		if (aaModeProp.aaMode == DOM::FrameElement::ANTI_ALIAS_MODE_CUSTOM)
		{
			aaMode.push_back(JSONNode("thickness", aaModeProp.customAAModeProp.aaThickness));
			aaMode.push_back(JSONNode("sharpness", aaModeProp.customAAModeProp.aaSharpness));
		}
		m_pTextElem->push_back(aaMode);

		std::string txt = displayText;
		Utils::ReplaceAll(txt, "\n", "\\n");
		Utils::ReplaceAll(txt, "\r", "\\n");
		Utils::ReplaceAll(txt, "\t", "");
		m_pTextElem->push_back(JSONNode("txt", txt));

		behaviour.set_name("behaviour");

		if (textBehaviour.type == 0)
		{
			// Static Text
			behaviour.push_back(JSONNode("type", "Static"));
			behaviour.push_back(JSONNode("flow", Utils::ToString(textBehaviour.u.staticText.flow)));
			behaviour.push_back(JSONNode("orientation", Utils::ToString(textBehaviour.u.staticText.orientationMode)));
		}
		else if (textBehaviour.type == 1)
		{
			// Dynamic text
			behaviour.push_back(JSONNode("type", "Dynamic"));
			behaviour.push_back(JSONNode("name", textBehaviour.name));
			behaviour.push_back(JSONNode("isBorderDrawn", textBehaviour.u.dynamicText.borderDrawn ? true : false));
			behaviour.push_back(JSONNode("lineMode", Utils::ToString(textBehaviour.u.dynamicText.lineMode)));
			behaviour.push_back(JSONNode("isRenderAsHTML", textBehaviour.u.dynamicText.renderAsHtml ? true : false));
			behaviour.push_back(JSONNode("isScrollable", textBehaviour.u.dynamicText.scrollable ? true : false));
		}
		else
		{
			// Input text
			behaviour.push_back(JSONNode("type", "Input"));
			behaviour.push_back(JSONNode("name", textBehaviour.name));
			behaviour.push_back(JSONNode("isBorderDrawn", textBehaviour.u.inputText.borderDrawn ? true : false));
			behaviour.push_back(JSONNode("lineMode", Utils::ToString(textBehaviour.u.inputText.lineMode)));
			behaviour.push_back(JSONNode("isRenderAsHTML", textBehaviour.u.inputText.renderAsHtml ? true : false));
			behaviour.push_back(JSONNode("isScrollable", textBehaviour.u.inputText.scrollable ? true : false));
			behaviour.push_back(JSONNode("isPassword", textBehaviour.u.inputText.password ? true : false));
		}

		behaviour.push_back(JSONNode("isSelectable", textBehaviour.selectable ? true : false));

		m_pTextElem->push_back(behaviour);

		// Start a paragraph array
		m_pTextParaArray = new JSONNode(JSON_ARRAY);
		ASSERT(m_pTextParaArray != NULL);

		m_pTextParaArray->set_name("paras");

		return FCM_SUCCESS;
	}


	FCM::Result OutputWriter::StartDefineParagraph(
		FCM::U_Int32 startIndex,
		FCM::U_Int32 length,
		const DOM::FrameElement::PARAGRAPH_STYLE& paragraphStyle)
	{
		m_pTextPara = new JSONNode(JSON_NODE);
		ASSERT(m_pTextPara != NULL);

		m_pTextPara->push_back(JSONNode("startIndex", startIndex));
		m_pTextPara->push_back(JSONNode("length", length));
		m_pTextPara->push_back(JSONNode("indent", paragraphStyle.indent));
		m_pTextPara->push_back(JSONNode("leftMargin", paragraphStyle.leftMargin));
		m_pTextPara->push_back(JSONNode("rightMargin", paragraphStyle.rightMargin));
		m_pTextPara->push_back(JSONNode("linespacing", paragraphStyle.lineSpacing));
		m_pTextPara->push_back(JSONNode("alignment", Utils::ToString(paragraphStyle.alignment)));

		m_pTextRunArray = new JSONNode(JSON_ARRAY);
		ASSERT(m_pTextRunArray != NULL);

		m_pTextRunArray->set_name("textRun");

		return FCM_SUCCESS;
	}


	FCM::Result OutputWriter::StartDefineTextRun(
		FCM::U_Int32 startIndex,
		FCM::U_Int32 length,
		const TEXT_STYLE& textStyle)
	{
		JSONNode textRun(JSON_NODE);
		JSONNode style(JSON_NODE);

		textRun.push_back(JSONNode("startIndex", startIndex));
		textRun.push_back(JSONNode("length", length));

		style.set_name("style");
		style.push_back(JSONNode("fontName", textStyle.fontName));
		style.push_back(JSONNode("fontSize", textStyle.fontSize));
		style.push_back(JSONNode("fontColor", Utils::ToString(textStyle.fontColor)));
		style.push_back(JSONNode("fontStyle", textStyle.fontStyle));
		style.push_back(JSONNode("letterSpacing", textStyle.letterSpacing));
		style.push_back(JSONNode("isRotated", textStyle.rotated ? true : false));
		style.push_back(JSONNode("isAutoKern", textStyle.autoKern ? true : false));
		style.push_back(JSONNode("baseLineShiftStyle", Utils::ToString(textStyle.baseLineShiftStyle)));
		style.push_back(JSONNode("link", textStyle.link));
		style.push_back(JSONNode("linkTarget", textStyle.linkTarget));

		textRun.push_back(style);
		m_pTextRunArray->push_back(textRun);

		return FCM_SUCCESS;
	}


	FCM::Result OutputWriter::EndDefineTextRun()
	{
		return FCM_SUCCESS;
	}


	FCM::Result OutputWriter::EndDefineParagraph()
	{
		m_pTextPara->push_back(*m_pTextRunArray);
		delete m_pTextRunArray;
		m_pTextRunArray = NULL;

		m_pTextParaArray->push_back(*m_pTextPara);
		delete m_pTextPara;
		m_pTextPara = NULL;

		return FCM_SUCCESS;
	}


	FCM::Result OutputWriter::EndDefineClassicText()
	{
		m_pTextElem->push_back(*m_pTextParaArray);

		delete m_pTextParaArray;
		m_pTextParaArray = NULL;

		m_pTextArray->push_back(*m_pTextElem);

		delete m_pTextElem;
		m_pTextElem = NULL;

		return FCM_SUCCESS;
	}


	FCM::Result OutputWriter::DefineSound(
		FCM::U_Int32 resId,
		const std::string& libPathName,
		DOM::LibraryItem::PIMediaItem pMediaItem)
	{
		FCM::Result res;
		JSONNode soundElem(JSON_NODE);
		std::string name;
		std::string ext;

		soundElem.set_name("sound");
		soundElem.push_back(JSONNode("assetId", resId));

		FCM::AutoPtr<FCM::IFCMUnknown> pUnk;

		if (!m_soundFolderCreated)
		{
			res = Utils::CreateDir(m_outputSoundFolder, m_pCallback);
			if (!(FCM_SUCCESS_CODE(res)))
			{
				Utils::Trace(m_pCallback, "ERROR: Output sound folder (%s) could not be created\n", m_outputSoundFolder.c_str());
				return res;
			}
			m_soundFolderCreated = true;
		}

		Utils::GetFileExtension(libPathName, ext);
		Utils::GetJavaScriptName(libPathName, name);

		std::string soundRelPath = m_soundsPath + name + "." + ext;
		std::string soundExportPath = m_outputSoundFolder + name + "." + ext;

		res = m_pCallback->GetService(DOM::FLA_SOUND_SERVICE, pUnk.m_Ptr);
		ASSERT(FCM_SUCCESS_CODE(res));
		FCM::AutoPtr<DOM::Service::Sound::ISoundExportService> soundExportService = pUnk;
		if (soundExportService)
		{
			FCM::AutoPtr<FCM::IFCMCalloc> pCalloc;
#ifdef _WINDOWS
			fs::path exportPath(soundExportPath);
			FCM::StringRep16 pFilePath = Utils::ToString16(fs::canonical(exportPath).string(), m_pCallback);
#else
			FCM::StringRep16 pFilePath = Utils::ToString16(soundExportPath, m_pCallback);
#endif
			res = soundExportService->ExportToFile(pMediaItem, pFilePath);
			ASSERT(FCM_SUCCESS_CODE(res));
			pCalloc = Utils::GetCallocService(m_pCallback);
			ASSERT(pCalloc.m_Ptr != NULL);
			pCalloc->Free(pFilePath);
		}

		soundElem.push_back(JSONNode("src", soundRelPath));
		soundElem.push_back(JSONNode("name", name));

		m_pSoundArray->push_back(soundElem);

		return FCM_SUCCESS;
	}

	OutputWriter::OutputWriter(
		FCM::PIFCMCallback pCallback,
		std::string& basePath,
		std::string& outputFile,
		std::string& imagesPath,
		std::string& soundsPath,
		std::string& htmlPath,
		std::string& libsPath,
		std::string& stageName,
		std::string& nameSpace,
		std::string& outputVersion,
		std::string& outputFormat,
		bool html,
		bool libs,
		bool images,
		bool sounds,
		bool compactShapes,
		bool compressJS,
		bool loopTimeline,
		bool spritesheets,
		int spritesheetSize,
		double spritesheetScale)
		: m_pCallback(pCallback),
		m_outputFile(outputFile),
		m_outputVersion(outputVersion),
		m_outputFormat(outputFormat),
		m_outputDataFile(basePath + outputFile + "on"),
		m_outputImageFolder(basePath + imagesPath),
		m_outputSoundFolder(basePath + soundsPath),
		m_basePath(basePath),
		m_imagesPath(imagesPath),
		m_soundsPath(soundsPath),
		m_htmlPath(htmlPath),
		m_libsPath(libsPath),
		m_stageName(stageName),
		m_nameSpace(nameSpace),
		m_html(html),
		m_libs(libs),
		m_images(images),
		m_sounds(sounds),
		m_compactShapes(compactShapes),
		m_compressJS(compressJS),
		m_loopTimeline(loopTimeline),
		m_spritesheets(spritesheets),
		m_spritesheetSize(spritesheetSize),
		m_spritesheetScale(spritesheetScale),
		m_shapeElem(NULL),
		m_pathArray(NULL),
		m_pathElem(NULL),
		m_firstSegment(false),
		m_symbolNameLabel(0),
		m_imageFolderCreated(false),
		m_soundFolderCreated(false)
	{
		m_pRootNode = new JSONNode(JSON_NODE);
		ASSERT(m_pRootNode);

		m_pShapeArray = new JSONNode(JSON_ARRAY);
		ASSERT(m_pShapeArray);
		m_pShapeArray->set_name("Shapes");

		m_pTimelineArray = new JSONNode(JSON_ARRAY);
		ASSERT(m_pTimelineArray);
		m_pTimelineArray->set_name("Timelines");

		m_pBitmapArray = new JSONNode(JSON_ARRAY);
		ASSERT(m_pBitmapArray);
		m_pBitmapArray->set_name("Bitmaps");

		m_pTextArray = new JSONNode(JSON_ARRAY);
		ASSERT(m_pTextArray);
		m_pTextArray->set_name("Texts");

		m_pSoundArray = new JSONNode(JSON_ARRAY);
		ASSERT(m_pSoundArray);
		m_pSoundArray->set_name("Sounds");
		m_strokeStyle.type = INVALID_STROKE_STYLE_TYPE;

		m_pTweenArray = NULL;
	}

	OutputWriter::~OutputWriter()
	{
		delete m_pBitmapArray;
		delete m_pSoundArray;
		delete m_pTimelineArray;
		delete m_pShapeArray;
		delete m_pTextArray;
		delete m_pRootNode;
	}

	FCM::Result OutputWriter::StartPreview(FCM::PIFCMCallback pCallback)
	{
		FCM::Result res = FCM_SUCCESS;
		std::string cmd;
		std::string extensionPath;
		Utils::GetExtensionPath(extensionPath, m_pCallback);
		std::string preview = "\"";
		preview += extensionPath + PREVIEW_APP;
		preview += "\"";
		preview += " --src=\"" + m_basePath;
		preview += m_htmlPath + "\"";
		preview += " --title=\"" + m_stageName + "\"";
		preview += " --width=" + m_substitutions["width"];
		preview += " --height=" + m_substitutions["height"];
		preview += " --background=" + m_substitutions["background"];

#ifdef _DEBUG
		preview += " --devTools";
#endif
		Utils::RunElectron(preview);
		return res;
	}

	FCM::Result OutputWriter::StopPreview()
	{
		FCM::Result res = FCM_SUCCESS;

#ifdef _WINDOWS
		// currently this operation is not supported on windows!
#else
		// ps aux find's everything that's running
		// grep is searching for any process with the string 'electron' followed by the parent directory.
		//   (excluding the grep process itself)
		// awk is printing the second string returned by the grep (which is the pid)
		// kill is operating over all pids returned in this way
		std::string extensionPath;
		Utils::GetExtensionPath(extensionPath, m_pCallback);
		std::string preview = extensionPath + PREVIEW_APP;
		std::string cmd = "kill $(ps aux | grep '\\<.*[e]lectron.*\\> " + preview + "' | awk '{print $2}')";
		popen(cmd.c_str(), "r");
#endif // _WINDOWS
		return res;
	}

	FCM::Boolean OutputWriter::GetImageExportFileName(const std::string& libPathName, std::string& name)
	{
		std::map<std::string, std::string>::iterator it = m_imageMap.find(libPathName);

		name = "";

		if (it != m_imageMap.end())
		{
			// Image already exported
			name = it->second;
			return true;
		}

		return false;
	}


	void OutputWriter::SetImageExportFileName(const std::string& libPathName, const std::string& name)
	{
		// Assumption: Name is not already present in the map
		ASSERT(m_imageMap.find(libPathName) == m_imageMap.end());

		m_imageMap.insert(std::pair<std::string, std::string>(libPathName, name));
	}

	bool OutputWriter::SaveFromTemplate(const std::string &in, const std::string &out)
	{
		std::string extensionPath;
		Utils::GetExtensionPath(extensionPath, m_pCallback);

		// Get the path to the templates folder
		std::string templatePath(extensionPath + TEMPLATE_FOLDER_NAME + in);
		std::string outputPath(m_basePath + out);

		std::ifstream inFile(templatePath.c_str());
		if (!inFile)
		{
			return false;
		}
		std::stringstream strStream;
		strStream << inFile.rdbuf();
		std::string content(strStream.str());

		std::map<std::string, std::string>::const_iterator i;
		for (i = m_substitutions.begin(); i != m_substitutions.end(); i++)
		{
			Utils::ReplaceAll(content, "${" + i->first + "}", i->second);
		}

		// Save the file
		Save(outputPath, content);

		return true;
	}

	void OutputWriter::Save(const std::string &outputFile, const std::string &content)
	{
		std::fstream file;
		Utils::OpenFStream(outputFile, file, std::ios_base::trunc | std::ios_base::out, m_pCallback);
		file << content;
		file.close();
	}
};
