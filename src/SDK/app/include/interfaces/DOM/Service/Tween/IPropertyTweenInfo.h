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
 * @file  IPropertyTweenInfo.h
 *
 * @brief This file contains interface for IPropertyTweenInfo. IPropertyTweenInfo
 *        represents a tween of a property.
 */

#ifndef IPROPERTY_TWEEN_INFO_H_
#define IPROPERTY_TWEEN_INFO_H_

#include "FCMPreConfig.h"
#include "FCMPluginInterface.h"
#include "Utils/DOMTypes.h"
#include "Service/Tween/IEasingInfo.h"

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
             *        IPropertyTweenInfo.
             *
             * @note  Textual Representation: {8B22068B-3AE5-42C6-AFCC-EE6C48DCCF1A}
             */
            FCM::ConstFCMIID IID_IPROPERTY_TWEEN_INFO =
                {0x8b22068b, 0x3ae5, 0x42c6, {0xaf, 0xcc, 0xee, 0x6c, 0x48, 0xdc, 0xcf, 0x1a}};
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
             * @class IPropertyTweenInfo
             *
             * @brief Represents a tweenable property
             */
            BEGIN_DECLARE_INTERFACE(IPropertyTweenInfo, IID_IPROPERTY_TWEEN_INFO)

                // Returns a pair containing a starting and ending state of the property
                virtual FCM::Result _FCMCALL GetTweenStates(FCM::PIFCMPair& tweenStates) = 0;

                // Returns the the path along which the property is tweened
                virtual FCM::Result _FCMCALL GetPath(DOM::Service::Shape::PIPath& path) = 0;

                // Returns easing information
                virtual FCM::Result _FCMCALL GetEasingInfo(DOM::Service::Tween::PIEasingInfo& easingInfo) = 0;

            END_DECLARE_INTERFACE
        }
    }
};


/* -------------------------------------------------- Inline / Functions */


#include "FCMPostConfig.h"

#endif // IPROPERTY_TWEEN_INFO_H_


