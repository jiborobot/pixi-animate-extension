/*************************************************************************
 * ADOBE CONFIDENTIAL
 * ___________________
 *
 *  Copyright 2018 Adobe Systems Incorporated
 *  All Rights Reserved.
 *
 * NOTICE:  All information contained herein is, and remains
 * the property of Adobe Systems Incorporated and its suppliers,
 * if any.  The intellectual and technical concepts contained
 * herein are proprietary to Adobe Systems Incorporated and its
 * suppliers and are protected by all applicable intellectual property
 * laws, including trade secret and copyright laws.
 * Dissemination of this information or reproduction of this material
 * is strictly forbidden unless prior written permission is obtained
 * from Adobe Systems Incorporated.
 **************************************************************************/

/**
 * @file  IEasingInfo.h
 *
 * @brief This file contains interface for IEasingInfo. IEasingInfo
 *        represents a easing of a property.
 */

#ifndef IEASING_INFO_H_
#define IEASING_INFO_H_

#include "FCMPreConfig.h"
#include "FCMPluginInterface.h"
#include "Utils/DOMTypes.h"
#include "FrameElement/IShape.h"
#include "Service/Shape/IPath.h"

/* -------------------------------------------------- Forward Decl */


/* -------------------------------------------------- Enums */


/* -------------------------------------------------- Macros / Constants */

namespace DOM
{
    namespace Service
    {
        namespace Tween
        {
            /**
             * @brief Defines the universally-unique interface ID for 
             *        IEasingInfo.
             *
             * @note  Textual Representation: {103C76A7-BA42-4F66-8367-CACAE3D540F3}
             */
            FCM::ConstFCMIID IID_IEASING_INFO =
                {0x103c76a7, 0xba42, 0x4f66, {0x83, 0x67, 0xca, 0xca, 0xe3, 0xd5, 0x40, 0xf3}};
        }
    }
}


/* -------------------------------------------------- Structs / Unions */


/* -------------------------------------------------- Class Decl */

namespace DOM
{
    namespace Service
    {
        namespace Tween
        {
            /**
             * @class IEasingInfo
             *
             * @brief 
             */
            BEGIN_DECLARE_INTERFACE(IEasingInfo, IID_IEASING_INFO)

                // Returns name of the easing.
                virtual FCM::Result _FCMCALL GetName(FCM::StringRep16* ppEasingName) = 0;

                // Returns the parameters that control the easing curve. Currently, 
                // only parameter "strength" will be part of the dictionary.
                virtual FCM::Result _FCMCALL GetParameters(FCM::PIFCMDictionary& easingParameters) = 0;

                // Returns the easing path. This may be returned only for custom easing.
                virtual FCM::Result _FCMCALL GetEasingPath(DOM::Service::Shape::PIPath& easingPath) = 0;

            END_DECLARE_INTERFACE
        }
    }
};


/* -------------------------------------------------- Inline / Functions */


#include "FCMPostConfig.h"

#endif // IEASING_INFO_H_
