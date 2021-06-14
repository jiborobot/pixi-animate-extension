/*************************************************************************
*
* ADOBE CONFIDENTIAL
* ___________________
*
*  Copyright 2019 Adobe Systems Incorporated
*  All Rights Reserved.
*
* NOTICE:  All information contained herein is, and remains
* the property of Adobe Systems Incorporated and its suppliers,
* if any.  The intellectual and technical concepts contained
* herein are proprietary to Adobe Systems Incorporated and its
* suppliers and may be covered by U.S. and Foreign Patents,
* patents in process, and are protected by trade secret or copyright law.
* Dissemination of this information or reproduction of this material
* is strictly forbidden unless prior written permission is obtained
* from Adobe Systems Incorporated.
**************************************************************************/

/**
 * @file  IComponentInstance.h
 *
 * @brief This file contains the interface for IComponentInstance. IComponentInstance
 *        interface represents a component on the stage.
 */

#ifndef ICOMPONENT_INSTANCE_H_
#define ICOMPONENT_INSTANCE_H_

#include "FCMPreConfig.h"
#include "FCMPluginInterface.h"
#include "Utils/DOMTypes.h"
#include "IInstance.h"


/* -------------------------------------------------- Forward Decl */


/* -------------------------------------------------- Enums */


/* -------------------------------------------------- Macros / Constants */

namespace DOM 
{
    namespace FrameElement
    {
        /**
         * @brief Defines the universally-unique interface ID for 
         *        IComponentInstance.
         *
         * @note  Textual Representation: {C40A1147-0914-480C-A289-7B974E4EAA88}
         */
        FCM::ConstFCMIID IID_ICOMPONENT_INSTANCE =
            { 0xc40a1147, 0x914, 0x480c,{ 0xa2, 0x89, 0x7b, 0x97, 0x4e, 0x4e, 0xaa, 0x88 } };
		
    }
}


/* -------------------------------------------------- Structs / Unions */


/* -------------------------------------------------- Class Decl */

namespace DOM 
{
    namespace FrameElement
    {
        /**
         * @class IComponentInstance
         *
         * @brief Defines an interface that represents an instance of a component
         *        present on the stage.
         */
        BEGIN_DECLARE_INTERFACE(IComponentInstance, IID_ICOMPONENT_INSTANCE)
            

            /**
             * @brief  This functions returns parameters of the component instance.
             *
             * @param  pComponentParameter (OUT)
             *         Dictionary containing parameters of the component instance.
             *
             * @return On success, FCM_SUCCESS is returned, else an error code is returned.
             */
            virtual FCM::Result _FCMCALL GetParameters(FCM::PIFCMDictionary& pComponentParameter) = 0;


        END_DECLARE_INTERFACE
    }
}


/* -------------------------------------------------- Inline / Functions */


#include "FCMPostConfig.h"

#endif // ICOMPONENT_INSTANCE_H_

