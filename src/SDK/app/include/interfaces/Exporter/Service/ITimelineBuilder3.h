/******************************************************************************
* ADOBE CONFIDENTIAL
* ___________________
*
*  Copyright [2015] Adobe Systems Incorporated
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
 * @file  ITimelineBuilder3.h
 *
 * @brief This file contains interface for ITimelineBuilder3. 
 *        ITimelineBuilder3 represents a builder to build a timeline.
 */

#ifndef ITIMELINE_BUILDER_3_H_
#define ITIMELINE_BUILDER_3_H_

#include "FCMPreConfig.h"
#include "FCMPluginInterface.h"
#include "ITimelineBuilder2.h"


/* -------------------------------------------------- Forward Decl */

/* -------------------------------------------------- Enums */


/* -------------------------------------------------- Macros / Constants */

namespace Exporter
{
    namespace Service
    {
        /**
         * @brief Defines the universally-unique interface ID for 
         *        ITimelineBuilder3.
         *
         * @note  Textual Representation:  {F1478D8D-9046-41B9-912F-679E52FD0D24}
         */
        FCM::ConstFCMIID IID_ITIMELINE_BUILDER_3 =
			{ 0xf1478d8d, 0x9046, 0x41b9,{ 0x91, 0x2f, 0x67, 0x9e, 0x52, 0xfd, 0xd, 0x24 } };
    }
}


/* -------------------------------------------------- Structs / Unions */


/* -------------------------------------------------- Class Decl */

namespace Exporter
{
    namespace Service
    {
        /**
         * @class ITimelineBuilder3
         *
         * @brief This interface represents a builder for a timeline. ITimelineBuilder3
         *        contains all the methods inherited from ITimelineBuilder and the new methods 
         *        mentioned in this file that are invoked by the FrameCommandGenerator 
         *        service (implemented in 'Adobe Animate CC') to add frame commands for 
         *        a timeline.
         *
         * @note  This interface is available in version 1.1.0 of the SDK and above.
         */
        BEGIN_DECLARE_INTERFACE_INHERIT(ITimelineBuilder3, IID_ITIMELINE_BUILDER_3, ITimelineBuilder2)
            
			/**
			* @brief This function is invoked when transform matrix of the object changes in
			*        any frame.
			*
			* @param objectId (IN)
			*        Object Identifier
			*
			* @param matrix (IN)
			*        A 3D matrix that defines the transform to be applied to the object. This matrix contains Z-depth information
			*
			* @return On success, FCM_SUCCESS is returned, else an error code is returned.
			*/
			virtual FCM::Result _FCMCALL Update3dDisplayTransform(
				FCM::U_Int32 objectId,
				const DOM::Utils::MATRIX3D& matrix) = 0;
            
        END_DECLARE_INTERFACE

    }
}


/* -------------------------------------------------- Inline / Functions */


#include "FCMPostConfig.h"

#endif // ITIMELINE_BUILDER_2_H_

