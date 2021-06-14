/******************************************************************************
* ADOBE CONFIDENTIAL
* ___________________
*
*  Copyright [2018] Adobe Systems Incorporated
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
******************************************************************************/

/**
* @file  ITimeline1.h
*
* @brief This file contains the interface for ITimeline. The ITimeline
*        interface represents the timeline. This represents the timelines for
*        both main timeline and the movie-clip.
*/

#ifndef ITIMELINE1_H_
#define ITIMELINE1_H_


#include "FCMPreConfig.h"
#include "ITimeline.h"


/* -------------------------------------------------- Forward Decl */

namespace FCM
{
	FORWARD_DECLARE_INTERFACE(IFCMList);
}


/* -------------------------------------------------- Macros / Constants */

namespace DOM
{
	/**
	* @brief Defines the universally-unique interface ID for
	*        ITimeline1.
	*
	* @note  Textual Representation: {3070BD72-890B-47C8-AFBB-ED15AD824EDF}
	*/
	FCM::ConstFCMIID IID_ITIMELINE1 =
	{0x3070bd72, 0x890b, 0x47c8, { 0xaf, 0xbb, 0xed, 0x15, 0xad, 0x82, 0x4e, 0xdf }};


}


namespace DOM
{
	/**
	* @class ITimeline1
	*
	* @brief Defines the interface that represents the timeline.
	*/
	BEGIN_DECLARE_INTERFACE_INHERIT(ITimeline1, IID_ITIMELINE1, ITimeline);
		/**
		* @brief  This function returns true if "Advanced layers" mode is enabled for this timeline else returns false.
		*
		* @param  advancedLayersEnabled boolean (OUT)
		*
		*/

		virtual FCM::Result _FCMCALL AdvancedLayersEnabled(FCM::Boolean& advancedLayersEnabled) = 0;

		/**
		* @brief  This function returns a list of Camera (ICamera) for the
		*         timeline.
		*
		* @param  cameraList (OUT)
		*
		*/

		virtual FCM::Result _FCMCALL GetCameras(FCM::PIFCMList& cameraList) = 0;

	END_DECLARE_INTERFACE
};


/* -------------------------------------------------- Inline / Functions */


#include "FCMPostConfig.h"

#endif // ITIMELINE_H_

