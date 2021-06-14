#include "TweenWriter.h"
#include "ApplicationFCMPublicIDs.h"
#include "FCMTypes.h"
#include "FCMPluginInterface.h"
#include "FrameElement/IInstance.h"
#include "FrameElement/IMovieClip.h"
#include "ILibraryItem.h"
#include "DOM/Service/Shape/IPath.h"
#include "DOM/Service/Shape/IEdge.h"
#include "DOM/Utils/DOMTypes.h"

using namespace FCM;

namespace PixiJS
{
	Result TweenWriter::ReadTimeline(DOM::ITimeline* pTimeline, const std::string timelineName)
	{
		JSONNode timelineElement(JSON_NODE);
		timelineElement.push_back(JSONNode("timelineName", timelineName));
		JSONNode tweensArray(JSON_ARRAY);
		tweensArray.set_name("tweens");
		bool hadTween = false;
		Result res;
		FCMListPtr pLayerList;
		pTimeline->GetLayers(pLayerList.m_Ptr);
		U_Int32 layerCount;
		pLayerList->Count(layerCount);
		for (U_Int32 l = 0; l < layerCount; ++l)
		{
			AutoPtr<DOM::ILayer> testLayer = pLayerList[l];
			AutoPtr<IFCMUnknown> pLayerType;
			testLayer->GetLayerType(pLayerType.m_Ptr);
			AutoPtr<DOM::Layer::ILayerNormal> normalLayer = pLayerType;
			if (normalLayer.m_Ptr == NULL)
			{
				// not a normal layer, bail
				continue;
			}

			FCMListPtr pKeyFrameList;
			normalLayer->GetKeyFrames(pKeyFrameList.m_Ptr);
			U_Int32 keyframeCount;
			pKeyFrameList->Count(keyframeCount);
			for (U_Int32 f = 0; f < keyframeCount; ++f)
			{
				AutoPtr<DOM::IFrame> frame = pKeyFrameList[f];
				U_Int32 duration;
				frame->GetDuration(duration);
				if (duration == 1)
				{
					// can't tween on a frame duration of 1
					continue;
				}
				U_Int32 startFrameIndex;
				U_Int32 endFrameIndex;
				frame->GetStartFrameIndex(startFrameIndex);
				endFrameIndex = startFrameIndex + duration;

				PIFCMList frameElements;
				res = frame->GetFrameElements(frameElements);
				if (FCM_FAILURE_CODE(res))
				{
					Utils::Trace(m_pCallback, "Failed to get frame elements: %i\n", res);
					return res;
				}
				U_Int32 elementCount;
				frameElements->Count(elementCount);
				for (U_Int32 e = 0; e < elementCount; ++e)
				{
					PIFCMUnknown unknownElement = (*frameElements)[0];
					DOM::FrameElement::PIFrameDisplayElement element = (DOM::FrameElement::PIFrameDisplayElement)unknownElement;
					if (element == NULL)
					{
						// not actually a display element, skip
						continue;
					}
					// read potential tween, if there was a tween note that so that we can know any tween was present in this timeline
					if (ReadTween(element, tweensArray, startFrameIndex, endFrameIndex))
					{
						hadTween = true;
					}
				}
			}
		}
		if (hadTween)
		{
			timelineElement.push_back(tweensArray);
			m_pTweenArray->push_back(timelineElement);
		}
	}

	TweenWriter::TweenWriter(FCM::PIFCMCallback pCallback) :
		m_pCallback(pCallback)
	{
		m_pTweenArray = new JSONNode(JSON_ARRAY);
		ASSERT(m_pTweenArray);
		m_pTweenArray->set_name("Tweens");

		// Get the tweenInfo service.
		AutoPtr<IFCMUnknown> pUnk;
		Result res;
		res = m_pCallback->GetService(DOM::Service::Tween::TWEENINFO_SERVICE, pUnk.m_Ptr);
		if (FCM_FAILURE_CODE(res))
		{
			Utils::Trace(m_pCallback, "Failed to get Tween service\n");
			m_pTweenInfoService = NULL;
		}
		else
		{
			m_pTweenInfoService = pUnk;
		}
	}

	TweenWriter::~TweenWriter()
	{
		delete m_pTweenArray;
	}

	JSONNode* TweenWriter::GetRoot()
	{
		return m_pTweenArray;
	}

	bool TweenWriter::ReadTween(DOM::FrameElement::PIFrameDisplayElement element, JSONNode &tweensArray, FCM::U_Int32 start, FCM::U_Int32 end)
	{
		AutoPtr<IFCMList> pTweenInfoList;
		FCM::Result res = m_pTweenInfoService->GetElementTweenInfo(m_pCallback, element, pTweenInfoList.m_Ptr);
		if (FCM_FAILURE_CODE(res))
		{
			// probably no tweens attached
			// Utils::Trace(m_pCallback, "Failed to get element FrameTweenInfo: %i\n", res);
			return false;
		}
		bool tweenedAnyProp = false;
		JSONNode tweenNode(JSON_NODE);
		tweenNode.push_back(JSONNode("start", start));
		tweenNode.push_back(JSONNode("end", end));
		DOM::Utils::MATRIX2D matrix;
		element->GetMatrix(matrix);
		tweenNode.push_back(Utils::ToJSON("startTransform", matrix));
		// Block of code disabled due to throwing errors for unknown reason (see comments inside block)
		/*DOM::FrameElement::PIInstance asInstance = (DOM::FrameElement::PIInstance)element;
		if (asInstance != NULL)
		{
			Utils::Trace(m_pCallback, "Was an instance\n");
			DOM::PILibraryItem libItem;
			if (FCM_SUCCESS_CODE(asInstance->GetLibraryItem(libItem)))
			{
				Utils::Trace(m_pCallback, "Got library item\n");
				// unfortunately libItem here is null, even though we know it is attached to a library item
				if (libItem == NULL)
				{
					Utils::Trace(m_pCallback, "But library item was null\n");
				}
				else
				{
					FCM::StringRep16 pLibItemName = NULL;
					std::string libItemName;
					if (FCM_FAILURE_CODE(libItem->GetName(&pLibItemName)))
					{
						Utils::Trace(m_pCallback, "Failed to get name\n");
					}
					else
					{
						libItemName = Utils::ToString(pLibItemName, m_pCallback);
						Utils::Trace(m_pCallback, "Name: %s\n", libItemName);
						tweenNode.push_back(JSONNode("library", libItemName));
					}
				}
			}
		}
		DOM::FrameElement::PIMovieClip asMovieClip = (DOM::FrameElement::PIMovieClip)element;
		if (asMovieClip != NULL)
		{
			Utils::Trace(m_pCallback, "Was a clip\n");
			FCM::StringRep16 pInstanceName = NULL;
			std::string instanceName;
			// and unfortunately just calling GetName() here throws some sort of error
			asMovieClip->GetName(&pInstanceName);
			if (pInstanceName == NULL)
			{
				Utils::Trace(m_pCallback, "Failed to get name\n");
			}
			else
			{
				instanceName = Utils::ToString(pInstanceName, m_pCallback);
				tweenNode.push_back(JSONNode("instanceName", instanceName));
			}
		}*/

		U_Int32 tweenCount;
		pTweenInfoList->Count(tweenCount);
		// Utils::Trace(m_pCallback, "Number of tweens?: %i\n", tweenCount);
		for (U_Int32 i = 0; i < tweenCount; ++i)
		{
			// get the dictionary from the list
			FCM::AutoPtr<IFCMDictionary> pTweenDictionary;
			pTweenDictionary = (*pTweenInfoList)[i];
			std::string tweenType;
			Utils::ReadString(pTweenDictionary, kTweenKey_TweenType, tweenType);
			// confirm that it is a geometric tween, otherwise we are going to ignore it for now
			if (tweenType == "geometric")
			{
				// ListProps(pTweenDictionary);
				JSONNode posX(JSON_NODE);
				posX.set_name("x");
				if (ReadTranslateProp(pTweenDictionary, posX, "Motion_XY", "Pos_X"))
				{
					tweenNode.push_back(posX);
					tweenedAnyProp = true;
				}
				JSONNode posY(JSON_NODE);
				posY.set_name("y");
				if (ReadTranslateProp(pTweenDictionary, posY, "Motion_XY", "Pos_Y"))
				{
					tweenNode.push_back(posY);
					tweenedAnyProp = true;
				}
				JSONNode scaleX(JSON_NODE);
				scaleX.set_name("scaleX");
				if (ReadProp(pTweenDictionary, scaleX, "Scale_X"))
				{
					tweenNode.push_back(scaleX);
					tweenedAnyProp = true;
				}
				JSONNode scaleY(JSON_NODE);
				scaleY.set_name("scaleY");
				if (ReadProp(pTweenDictionary, scaleY, "Scale_Y"))
				{
					tweenNode.push_back(scaleY);
					tweenedAnyProp = true;
				}
				JSONNode rotation(JSON_NODE);
				rotation.set_name("rotation");
				if (ReadProp(pTweenDictionary, rotation, "Rotation_Z"))
				{
					tweenNode.push_back(rotation);
					tweenedAnyProp = true;
				}
				JSONNode skewX(JSON_NODE);
				skewX.set_name("skewX");
				if (ReadProp(pTweenDictionary, skewX, "Skew_X"))
				{
					tweenNode.push_back(skewX);
					tweenedAnyProp = true;
				}
				JSONNode skewY(JSON_NODE);
				skewY.set_name("skewY");
				if (ReadProp(pTweenDictionary, skewY, "Skew_Y"))
				{
					tweenNode.push_back(skewY);
					tweenedAnyProp = true;
				}

				// TODO: should this be here on the geometric tween? Even with an alpha change with a position change,
				// pTweenInfoList ends up with a count of 1
				JSONNode alpha(JSON_NODE);
				alpha.set_name("alpha");
				if (ReadProp(pTweenDictionary, alpha, "Alpha_Amount"))
				{
					tweenNode.push_back(alpha);
					tweenedAnyProp = true;
				}
			}
			else
			{
				// useful, but disabling for now so that we don't spam anyone's publishing
				// Utils::Trace(m_pCallback, "Found tween of unhandled type: %s\n", tweenType);
				// ListProps(pTweenDictionary.m_Ptr);
			}
		}

		if (tweenedAnyProp)
		{
			tweensArray.push_back(tweenNode);
		}
		return tweenedAnyProp;
	}

	void TweenWriter::ListProps(FCM::PIFCMDictionary dict)
	{
		U_Int32 itemCount;
		dict->Count(itemCount);
		FCM::StringRep8 key;
		// length of value in dictionary (reused for each call)
		FCM::U_Int32 valueLen;
		// type of value in dictionary (reused for each call)
		FCM::FCMDictRecTypeID type;
		FCM::Result res;
		for (U_Int32 i = 0; i < itemCount; ++i)
		{
			res = dict->GetNth(i, key, type, valueLen);
			if (FCM_FAILURE_CODE(res))
			{
				Utils::Trace(m_pCallback, "Failed to get property info for %i: %i\n", i, res);
			}
			else
			{
				Utils::Trace(m_pCallback, "Property in dict: %s\n", key);
			}
		}
	}

	bool TweenWriter::ReadProp(FCM::PIFCMDictionary tweenDict, JSONNode &propNode, const std::string propertyName)
	{
		double startValue = 0;
		double endValue = 0;
		// length of value in dictionary (reused for each call)
		FCM::U_Int32 valueLen;
		// type of value in dictionary (reused for each call)
		FCM::FCMDictRecTypeID type;
		// call result (reused for each call)
		FCM::Result res;
		// dictionary for the property - contains "Property_States" and "Property_Ease"
		PIFCMDictionary propertyDict;
		res = tweenDict->GetInfo((const FCM::StringRep8)propertyName.c_str(), type, valueLen);
		res = tweenDict->Get((const FCM::StringRep8)propertyName.c_str(), type, (FCM::PVoid)&propertyDict, valueLen);
		if (FCM_FAILURE_CODE(res))
		{
			// property isn't present, probably because it is not being tweened (or never exists on the tween data?)
			// Utils::Trace(m_pCallback, "Failed to get property dictionary for %s: %i\n", propertyName, res);
			return false;
		}
		// has property start/end states - "Start_Value" and "End_Value"
		PIFCMDictionary propertyStates;
		res = propertyDict->GetInfo("Property_States", type, valueLen);
		res = propertyDict->Get("Property_States", type, (FCM::PVoid)&propertyStates, valueLen);
		if (FCM_FAILURE_CODE(res))
		{
			// shouldn't fail, but to reduce potential noise don't trace
			// Utils::Trace(m_pCallback, "Failed to get property states for %s: %i\n", propertyName, res);
			return false;
		}
		// read the start & end values
		res = propertyStates->GetInfo("Start_Value", type, valueLen);
		res = propertyStates->Get("Start_Value", type, (FCM::PVoid)&startValue, valueLen);
		if (FCM_FAILURE_CODE(res))
		{
			// shouldn't fail, but to reduce potential noise don't trace
			// Utils::Trace(m_pCallback, "Failed to get start value for %s: %i\n", propertyName, res);
		}
		res = propertyStates->GetInfo("End_Value", type, valueLen);
		res = propertyStates->Get("End_Value", type, (FCM::PVoid)&endValue, valueLen);
		if (FCM_FAILURE_CODE(res))
		{
			// shouldn't fail, but to reduce potential noise don't trace
			// Utils::Trace(m_pCallback, "Failed to get end value for %s: %i\n", propertyName, res);
		}
		// if values are unchanged, bail
		if (startValue == endValue)
		{
			// Utils::Trace(m_pCallback, "Start and end was the same for %s, %d vs %d\n", propertyName, startValue, endValue);
			return false;
		}
		// record the start and end values - at this point, we could use these even if we can't get ease data and at least have something
		propNode.push_back(JSONNode("start", startValue));
		propNode.push_back(JSONNode("end", endValue));
		
		ReadEase(propertyDict, propNode);

		return true;
	}

	bool TweenWriter::ReadTranslateProp(FCM::PIFCMDictionary tweenDict, JSONNode &propNode, const std::string propertyName, const std::string subPropertyName)
	{
		double startValue = 0;
		double endValue = 0;
		// length of value in dictionary (reused for each call)
		FCM::U_Int32 valueLen;
		// type of value in dictionary (reused for each call)
		FCM::FCMDictRecTypeID type;
		// call result (reused for each call)
		FCM::Result res;
		// dictionary for the property - contains "Property_States" and "Property_Ease"
		PIFCMDictionary propertyDict;
		res = tweenDict->GetInfo((const FCM::StringRep8)propertyName.c_str(), type, valueLen);
		res = tweenDict->Get((const FCM::StringRep8)propertyName.c_str(), type, (FCM::PVoid)&propertyDict, valueLen);
		if (FCM_FAILURE_CODE(res))
		{
			// property isn't present, probably because it is not being tweened (or never exists on the tween data?)
			// Utils::Trace(m_pCallback, "Failed to get property dictionary for %s: %i\n", propertyName, res);
			return false;
		}
		// has dictionary start/end states - "Start_Value" and "End_Value"
		PIFCMDictionary propertyStates;
		res = propertyDict->GetInfo("Property_States", type, valueLen);
		res = propertyDict->Get("Property_States", type, (FCM::PVoid)&propertyStates, valueLen);
		if (FCM_FAILURE_CODE(res))
		{
			// shouldn't fail, but to reduce potential noise don't trace
			// Utils::Trace(m_pCallback, "Failed to get property states for %s: %i\n", propertyName, res);
			return false;
		}

		// has start states - "Pos_X" and "Pos_Y"
		PIFCMDictionary startXY;
		res = propertyStates->GetInfo("Start_Value", type, valueLen);
		res = propertyStates->Get("Start_Value", type, (FCM::PVoid)&startXY, valueLen);
		if(FCM_FAILURE_CODE(res))
		{
			//trace error
			return false;
		}
		//read the start value
		res = startXY->GetInfo((const FCM::StringRep8)subPropertyName.c_str(), type, valueLen);
		res = startXY->Get((const FCM::StringRep8)subPropertyName.c_str(), type, (FCM::PVoid)&startValue, valueLen);
		if(FCM_FAILURE_CODE(res))
		{
			//trace error
		}
		// has end states - "Pos_X" and "Pos_Y"
		PIFCMDictionary endXY;
		res = propertyStates->GetInfo("End_Value", type, valueLen);
		res = propertyStates->Get("End_Value", type, (FCM::PVoid)&endXY, valueLen);
		if (FCM_FAILURE_CODE(res))
		{
			//trace error
			return false;
		}
		//read the end value
		res = endXY->GetInfo((const FCM::StringRep8)subPropertyName.c_str(), type, valueLen);
		res = endXY->Get((const FCM::StringRep8)subPropertyName.c_str(), type, (FCM::PVoid)&endValue, valueLen);
		if (FCM_FAILURE_CODE(res))
		{
			//trace error
		}

		// if values are unchanged, bail
		if (startValue == endValue)
		{
			// Utils::Trace(m_pCallback, "Start and end was the same for %s, %d vs %d\n", propertyName, startValue, endValue);
			return false;
		}

		// record the start and end values - at this point, we could use these even if we can't get ease data and at least have something
		propNode.push_back(JSONNode("start", startValue));
		propNode.push_back(JSONNode("end", endValue));
		
		ReadEase(propertyDict, propNode);

		return true;
	}

	bool TweenWriter::ReadEase(FCM::PIFCMDictionary propertyDict, JSONNode& propNode)
	{
		// length of value in dictionary (reused for each call)
		FCM::U_Int32 valueLen;
		// type of value in dictionary (reused for each call)
		FCM::FCMDictRecTypeID type;
		// call result (reused for each call)
		FCM::Result res;
		// has property ease data - "Ease_Strength" and "Ease_Type"
		PIFCMDictionary propertyEase;
		res = propertyDict->GetInfo("Property_Ease", type, valueLen);
		res = propertyDict->Get("Property_Ease", type, (FCM::PVoid)&propertyEase, valueLen);
		if (FCM_FAILURE_CODE(res))
		{
			// shouldn't fail, but to reduce potential noise don't trace
			// Utils::Trace(m_pCallback, "Failed to get property ease for %s: %i\n", propertyName, res);
			return false;
		}
		double easeStrength = 0;
		res = propertyEase->GetInfo("Ease_Strength", type, valueLen);
		res = propertyEase->Get("Ease_Strength", type, (FCM::PVoid)&easeStrength, valueLen);

		res = propertyEase->GetInfo("Ease_Type", type, valueLen);
		std::vector<FCM::Byte> buffer_1(valueLen);
		std::string easeType;
		res = propertyEase->Get("Ease_Type", type, (FCM::PVoid)(&buffer_1[0]), valueLen);
		if (FCM_FAILURE_CODE(res))
		{
			// shouldn't fail, but to reduce potential noise don't trace
			// Utils::Trace(m_pCallback, "Failed to get ease type for %s: %i\n", propertyName, res);
			return false;
		}
		easeType = (char*)(&buffer_1[0]);
		// record ease values
		propNode.push_back(JSONNode("easeType", easeType));
		propNode.push_back(JSONNode("easeStrength", easeStrength));
		// TODO: custom path reading isn't working correctly: segments that definitely should be curved were
		// saying that they were Line segments with positions of 0
		/*
		if (easeType == "custom")
		{
			ReadCustomEase(propertyEase, propNode);
		}
		*/
		return true;
	}

	bool TweenWriter::ReadCustomEase(FCM::PIFCMDictionary easeDict, JSONNode& propNode)
	{
		// length of value in dictionary (reused for each call)
		FCM::U_Int32 valueLen;
		// type of value in dictionary (reused for each call)
		FCM::FCMDictRecTypeID type;
		// call result (reused for each call)
		FCM::Result res;

		DOM::Service::Shape::PIPath path;
		res = easeDict->GetInfo("Ease_Path", type, valueLen);
		res = easeDict->Get("Ease_Path", type, (FCM::PVoid)&path, valueLen);
		if (FCM_FAILURE_CODE(res))
		{
			// shouldn't fail, but to reduce potential noise don't trace
			Utils::Trace(m_pCallback, "Failed to get ease path: %i\n", res);
			return false;
		}
		FCM::PIFCMList edgeList;
		res = path->GetEdges(edgeList);
		if (FCM_FAILURE_CODE(res))
		{
			// shouldn't fail, but to reduce potential noise don't trace
			Utils::Trace(m_pCallback, "Failed to get edge list: %i\n", res);
			return false;
		}
		JSONNode pathNode(JSON_ARRAY);
		pathNode.set_name("easePath");
		U_Int32 edgeCount;
		edgeList->Count(edgeCount);
		for (U_Int32 e = 0; e < edgeCount; ++e)
		{
			DOM::Service::Shape::PIEdge edge = (DOM::Service::Shape::PIEdge)(*edgeList)[0];
			DOM::Utils::SEGMENT segment;
			edge->GetSegment(segment);
			JSONNode segmentNode(JSON_NODE);
			if (segment.segmentType == DOM::Utils::LINE_SEGMENT)
			{
				segmentNode.push_back(JSONNode("lineStartX", segment.line.endPoint1.x));
				segmentNode.push_back(JSONNode("lineStartY", segment.line.endPoint1.y));
				segmentNode.push_back(JSONNode("lineEndX", segment.line.endPoint2.x));
				segmentNode.push_back(JSONNode("lineEndY", segment.line.endPoint2.y));
			}
			else if (segment.segmentType == DOM::Utils::QUAD_BEZIER_SEGMENT)
			{
				segmentNode.push_back(JSONNode("anchor1X", segment.quadBezierCurve.anchor1.x));
				segmentNode.push_back(JSONNode("anchor1Y", segment.quadBezierCurve.anchor1.y));
				segmentNode.push_back(JSONNode("anchor2X", segment.quadBezierCurve.anchor2.x));
				segmentNode.push_back(JSONNode("anchor2Y", segment.quadBezierCurve.anchor2.y));
				segmentNode.push_back(JSONNode("controlX", segment.quadBezierCurve.control.x));
				segmentNode.push_back(JSONNode("controlY", segment.quadBezierCurve.control.y));
			}
			pathNode.push_back(segmentNode);
		}
		propNode.push_back(pathNode);
	}
}