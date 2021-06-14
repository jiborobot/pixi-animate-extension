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
 * @file  IColorTweenInfo.h
 *
 * @brief This file contains interface for IColorTweenInfo. IColorTweenInfo
 *        represents a color tween information. 
 */

#ifndef ICOLOR_TWEEN_INFO_H_
#define ICOLOR_TWEEN_INFO_H_

#include "FCMPreConfig.h"
#include "FCMPluginInterface.h"
#include "Utils/DOMTypes.h"


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
             *        IColorTweenInfo.
             *
             * @note  Textual Representation: {A58FED6D-CAE6-4108-A072-0AFA0945DF55}
             */
            FCM::ConstFCMIID IID_ICOLOR_TWEEN_INFO =
                {0xa58fed6d, 0xcae6, 0x4108, {0xa0, 0x72, 0xa, 0xfa, 0x9, 0x45, 0xdf, 0x55}};
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
             * @class IColorTweenInfo
             *
             * @brief Defines an interface that represents a tweening of color matrix.
             *        Color matrix tween provides information about starting and ending positions of 
             *        a color matrix tween.
             */
            BEGIN_DECLARE_INTERFACE(IColorTweenInfo, IID_ICOLOR_TWEEN_INFO)

                // Elements in each dictionary will be of form <key, value>. 
                // Value will typically be a IPropertyTweenInfo and key will be a string 
                // (example COLOR_ADDITIVE_RED)
                virtual FCM::Result _FCMCALL GetProperties(PIFCMDictionary& pPropDict) = 0;

            END_DECLARE_INTERFACE
        }
    }
};


/* -------------------------------------------------- Inline / Functions */


#include "FCMPostConfig.h"

#endif // ICOLOR_TWEEN_INFO_H_

