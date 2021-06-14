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
* @file  ITimeline.h
*
* @brief This file contains the interface for ITimeline. The ITimeline
*        interface represents the timeline. This represents the timelines for
*        both main timeline and the movie-clip.
*/

#ifndef ICAMERA_H_
#define ICAMERA_H_

#include "FCMPreConfig.h"
#include "FCMPluginInterface.h"
#include "Utils/DOMTypes.h"


namespace DOM
{
	/**
	* @brief Defines the universally-unique interface ID for
	*        ICamera.
	*
	* @note  Textual Representation: {C4C1BEFD-83EB-46A5-A993-A7930484FD6C}
	*/
	FCM::ConstFCMIID IID_ICAMERA = 
	{ 0xc4c1befd, 0x83eb, 0x46a5,{ 0xa9, 0x93, 0xa7, 0x93, 0x4, 0x84, 0xfd, 0x6c } };
}


namespace DOM
{

	/**
	* @class ICamera
	*
	* @brief Defines the interface that represents a Camera in the timeline.
	*/
	BEGIN_DECLARE_INTERFACE(ICamera, IID_ICAMERA)

		/**
		* @brief  gets Camera Zoom value
		*/
		virtual FCM::Result _FCMCALL GetZoom(FCM::U_Int32 frameIndex, FCM::Double& zoom) = 0;


		/**
		* @brief  gets tint applied on Camera
		*/
		virtual FCM::Result _FCMCALL GetTint(FCM::U_Int32 frameIndex, FCM::U_Int32 &amount, Utils::COLOR& color) = 0;
		/**
		* @brief  Gets Z-Depth of Camera.
		*
		*/
		virtual FCM::Result _FCMCALL GetZdepth(FCM::U_Int32 frameIndex, FCM::S_Int32& zdepth) = 0;

		/**
		* @brief  gets rotaion of Camera.
		*
		*/
		virtual FCM::Result _FCMCALL GetRotation(FCM::U_Int32 frameIndex, FCM::S_Int32& rotation) = 0;

		/**
		* @brief  Get Parent postion of the camera object.
		*/
		virtual FCM::Result _FCMCALL GetPosition(FCM::U_Int32 frameIndex, Utils::POINT2D& position) = 0;


		/**
		* @brief  Gets the Color Filter associated with this Camera. 
		*
		*/
		virtual FCM::Result _FCMCALL GetColorFilter(FCM::U_Int32 frameIndex,  FCM::Float &brightness,  FCM::Float &contrast,  FCM::Float &saturation,  FCM::Float &hue) = 0;

		/**
		* @brief  Gets the CameraMatrix associated with this Camera.
		*
		*/
		virtual FCM::Result _FCMCALL GetCameraMatrix(FCM::U_Int32 frameIndex, DOM::Utils::MATRIX2D &mat) = 0;

		END_DECLARE_INTERFACE
}

/* -------------------------------------------------- Inline / Functions */



#include "FCMPostConfig.h"

#endif // ITIMELINE_H_

