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
 * @file  IFilterTweenInfo.h
 *
 * @brief This file contains interface for IFilterTweenInfo. IFilterTweenInfo
 *        represents a filter tween information. 
 */

#ifndef IFILTER_TWEEN_INFO_H_
#define IFILTER_TWEEN_INFO_H_

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
             *        IFilterTweenInfo.
             *
             * @note  Textual Representation: {CC46BD20-6A95-4A89-8131-8334576272BC}
             */
            FCM::ConstFCMIID IID_IFILTER_TWEEN_INFO =
                {0xcc46bd20, 0x6a95, 0x4a89, {0x81, 0x31, 0x83, 0x34, 0x57, 0x62, 0x72, 0xbc}};
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
             * @class IFilterTweenInfo
             *
             * @brief Defines an interface that represents a tweening of filters.
             *        Filter tween provides information about starting and ending positions of 
             *        a filter tween.
             */
            BEGIN_DECLARE_INTERFACE(IFilterTweenInfo, IID_IFILTER_TWEEN_INFO)

                // Returns a list of dictionary. Each dictionary will correspond to one filter.
                // And elements in each dictionary will be of form <key, value>. 
                // Value will typically be a IPropertyTweenInfo and key will be a string 
                // (example BLUR_X)
                virtual FCM::Result _FCMCALL GetProperties(PIFCMList& pPropDictList) = 0;

            END_DECLARE_INTERFACE
        }
    }
};


/* -------------------------------------------------- Inline / Functions */


#include "FCMPostConfig.h"

#endif // IFILTER_TWEEN_INFO_H_

