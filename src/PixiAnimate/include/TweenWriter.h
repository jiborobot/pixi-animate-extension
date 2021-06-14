#ifndef JSON_TWEEN_WRITER_H_
#define JSON_TWEEN_WRITER_H_

#include "ITimeline.h"
#include "IFrame.h"
#include "ILayer.h"
#include "FrameElement/IFrameDisplayElement.h"
#include "Service/Tween/ITweenInfoService.h"
#include "JSONNode.h"
#include "Utils.h"
#include <vector>

class JSONNode;

namespace PixiJS
{
	class TweenWriter
	{
	public:
		FCM::Result ReadTimeline(DOM::ITimeline *pTimeline, const std::string timelineName);

		TweenWriter(FCM::PIFCMCallback pCallback);

		~TweenWriter();

		JSONNode *GetRoot();

	private:
		bool ReadTween(DOM::FrameElement::PIFrameDisplayElement element, JSONNode &tweensArray, FCM::U_Int32 start, FCM::U_Int32 end);

		bool ReadProp(FCM::PIFCMDictionary tweenDict, JSONNode &propNode, const std::string propertyName);
		bool ReadTranslateProp(FCM::PIFCMDictionary tweenDict, JSONNode &propNode, const std::string propertyName, const std::string subPropertyName);
		bool ReadEase(FCM::PIFCMDictionary propertyDict, JSONNode& propNode);
		bool ReadCustomEase(FCM::PIFCMDictionary easeDict, JSONNode& propNode);

		void ListProps(FCM::PIFCMDictionary dict);

		JSONNode *m_pTweenArray;

		FCM::PIFCMCallback m_pCallback;

		FCM::AutoPtr<DOM::Service::Tween::ITweenInfoService> m_pTweenInfoService;
	};
};

#endif