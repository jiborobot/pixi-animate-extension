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
 * @file  IShapeHintInfo.h
 *
 * @brief This file contains interface for IShapeHintInfo. IShapeHintInfo
 *        represents a shape hint information. 
 */

#ifndef ISHAPE_HINT_INFO_H_
#define ISHAPE_HINT_INFO_H_

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
             *        IShapeHintInfo.
             *
             * @note  Textual Representation: {33DDE09B-0DCC-45D3-8854-D705AA99AEF0}
             */
            FCM::ConstFCMIID IID_ISHAPE_HINT_INFO =
                {0x33dde09b, 0xdcc, 0x45d3, {0x88, 0x54, 0xd7, 0x5, 0xaa, 0x99, 0xae, 0xf0}};
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
             *
             * @class IShapeHintInfo
             *
             * @brief Defines an interface that provides information about hints for shape tweens.
             *        Currently, this is a marker(blank) interface.
             */
            BEGIN_DECLARE_INTERFACE(IShapeHintInfo, IID_ISHAPE_HINT_INFO)

            END_DECLARE_INTERFACE
        }
    }
};


/* -------------------------------------------------- Inline / Functions */


#include "FCMPostConfig.h"

#endif // ISHAPE_HINT_INFO_H_

