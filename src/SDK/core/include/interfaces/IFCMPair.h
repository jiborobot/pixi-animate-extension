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
 * @file  IFCMPair.h
 *
 * @brief This file contains interface for IFCMPair. 
 *        IFCMPair is an interface for generic container for storing pair of data.
 */ 

#ifndef IFCM_PAIR_H_
#define IFCM_PAIR_H_

#include "FCMPreConfig.h"
#include "FCMTypes.h"
#include "IFCMUnknown.h"


/* -------------------------------------------------- Forward Decl */


/* -------------------------------------------------- Macros / Constants */

namespace FCM 
{
    /**
     * @brief Defines the universally-unique interface ID for IFCMPair.
     *
     * @note  Textual Representation: {0C80393E-2037-4CC3-BF69-1CEE8175E16D}
     */
    FCM::ConstFCMIID FCMIID_IFCMPair =
        {0xc80393e, 0x2037, 0x4cc3, {0xbf, 0x69, 0x1c, 0xee, 0x81, 0x75, 0xe1, 0x6d}};
}


/* -------------------------------------------------- Enums */

namespace FCM
{
    /**
     * @brief This defines different types of pair IDs.
     */
    typedef enum
    {
        /** illegal */
        kFCMPairType_Invalid = 0,

        /** Returns a PIFCMUnknown. Put does AddRef; Remove does Release. */
        kFCMPairType_PIFCMUnknown,

        /** Returns a FCM::S_Int32. */
        kFCMPairType_Long,
        
        /** Returns a 32 bit IEEE single precision floating point number. */
        kFCMPairType_Float,
        
        /** FCM::Boolean */
        kFCMPairType_Bool,
        
        /** FCMGUID */
        kFCMPairType_FCMGUID,

        /** Arbitrary bytes */
        kFCMPairType_Bytes,
        
        /** Null-terminated StringRep8 string */
        kFCMPairType_StringRep8,

        /** FCM::Double */
        kFCMPairType_Double,

        /* Last */
        _kFCMPairType_Last_

    } FCMPairTypeID;

};  // namespace FCM


/* -------------------------------------------------- Structs / Unions */


/* -------------------------------------------------- Class Decl */

namespace FCM
{ 
    /**
     * @class IFCMPair
     *
     * @brief Defines the interface that represents a pair.
     */
    BEGIN_DECLARE_INTERFACE(IFCMPair, FCMIID_IFCMPair)

        virtual FCM::Result _FCMCALL SetValue(
            FCM::U_Int32 index,
            FCMPairTypeID type,
            FCM::PVoid value,
            FCM::U_Int32 valueLen) = 0;

        virtual FCM::Result _FCMCALL GetInfo(
            FCM::U_Int32 index,
            FCMPairTypeID& type,
            FCM::U_Int32& valueLen) = 0;

        virtual FCM::Result _FCMCALL GetValue(
            FCM::U_Int32 index,
            FCMPairTypeID type,
            FCM::PVoid value,
            FCM::U_Int32 valueLen) = 0;

		virtual FCM::Result _FCMCALL Remove(
			FCM::U_Int32 index) = 0;

        virtual FCM::Result _FCMCALL Clear() = 0;
        
        END_DECLARE_INTERFACE

};  // namespace FCM


/* -------------------------------------------------- Inline / Functions */


#include "FCMPostConfig.h"

#endif //IFCM_PAIR_H_
