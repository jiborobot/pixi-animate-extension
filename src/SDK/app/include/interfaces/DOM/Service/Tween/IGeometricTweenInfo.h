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
 * @file  IGeometricTweenInfo.h
 *
 * @brief This file contains interface for IGeometricTweenInfo. IGeometricTweenInfo
 *        represents a geometric tween information. 
 */

#ifndef IGEOMETRIC_TWEEN_INFO_H_
#define IGEOMETRIC_TWEEN_INFO_H_

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
             *        IGeometricTweenInfo.
             *
             * @note  Textual Representation: {35C091C6-C85A-496B-ADDD-906586106CF5}
             */
            FCM::ConstFCMIID IID_IGEOMETRIC_TWEEN_INFO =
                {0x35c091c6, 0xc85a, 0x496b, {0xad, 0xdd, 0x90, 0x65, 0x86, 0x10, 0x6c, 0xf5}};
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
             * @class IGeometricTweenInfo
             *
             * @brief Defines an interface that represents a geometric (Transform) tween.
             *        Geometric tween provides information about starting and ending positions of 
             *        a geometric tween.
             */
            BEGIN_DECLARE_INTERFACE(IGeometricTweenInfo, IID_IGEOMETRIC_TWEEN_INFO)

                //
                // Dictionary returned is in the form <key, value>. The key and the value can 
                // be in the following format:
                //  
                //      "RotationAngle" : Value will be a floating value. Value can be +ve or -ve.
                //                        +ve means clockwise and -ve means anti-clockwise.
                //      "Scale"         : Value will be a boolean and will correspond to "Scale" option in
                //                        Classic tween.
                //      "ScaleAlongPath": Value will be a boolean and will correspond to "Scale Along Path" option in
                //                        Classic tween.
                //      "ColorAlongPath": Value will be a boolean and will correspond to "Color Along Path" option in
                //                        Classic tween.
                //      "OrientedAlongPath" : Value will be a boolean and will correspond to "Orient Along Path" option in
                //                            Classic tween.
                //      "PROPERTY_X"    : Value will be a IPropertyTweenInfo
                //      and so on...
                //
                virtual FCM::Result _FCMCALL GetProperties(PIFCMDictionary& pPropDict) = 0;

            END_DECLARE_INTERFACE
        }
    }
};


/* -------------------------------------------------- Inline / Functions */


#include "FCMPostConfig.h"

#endif // IGEOMETRIC_TWEEN_INFO_H_

