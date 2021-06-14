/******************************************************************************
* ADOBE CONFIDENTIAL
* ___________________
*
*  Copyright [2013] Adobe Systems Incorporated
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
 * @file  DOMTypes.h
 *
 * @brief This file contains the types used for DOM traversal and access.
 */

#ifndef DOM_TYPES_H_
#define DOM_TYPES_H_

#include "FCMPreConfig.h"
#include "FCMTypes.h"
#include "IFCMUnknown.h"


/* -------------------------------------------------- Forward Decl */


/* -------------------------------------------------- Enums */

namespace DOM
{
    namespace Utils
    {
        /**
         * @enum  SegmentType
         *
         * @brief This defines the different types of curves.
         */
        enum SegmentType
        {
            /** Line */
            LINE_SEGMENT,

            /** Quadratic bezier curve */ 
            QUAD_BEZIER_SEGMENT,

            /** Cubic bezier curve */
            CUBIC_BEZIER_SEGMENT,
        };


        /**
         * @enum  FilterQualityType
         *
         * @brief This defines different quality types of filter.
         */
        enum FilterQualityType
        {
            /** Low quality filter */
            FILTER_QUALITY_LOW,

            /** Medium quality filter */
            FILTER_QUALITY_MEDIUM,

            /** High quality filter */
            FILTER_QUALITY_HIGH
        };
    

        /**
         * @enum  FilterType
         *
         * @brief This defines different types of filter.
         */
        enum FilterType
        {
            /** Inner type filter */
            FILTER_TYPE_INNER,

            /** Outer type filter */
            FILTER_TYPE_OUTER,

            /** Full type filter */
            FILTER_TYPE_FULL
        };


        /**
         * @enum  JoinType
         *
         * @brief This enumerates different types of joins. Join is formed when 
         *        two curves intersect at a point.
         */
        enum JoinType
        {
            /** Miter Join */
            MITER_JOIN,

            /** Round Join */
            ROUND_JOIN,

            /** Bevel Join */
            BEVEL_JOIN
        };


        /**
         * @enum  CapType
         *
         * @brief This enumerates different types of cap styles. Cap is formed for
         *        open ended lines/curves.
         */
        enum CapType
        {
            /** No cap */
            NO_CAP,

            /** Round cap */
            ROUND_CAP,

            /** Square cap */
            SQUARE_CAP
        };


        /**
         * @enum  ScaleType
         *
         * @brief This enumerates the types of "scale" that can be applied to 
         *        stroke.
         */
        enum ScaleType
        {
            /** Normal scale */
            STROKE_NORMAL_SCALE,

            /** Horizontal scale */
            STROKE_HORIZONTAL_SCALE,

            /** Vertical scale */
            STROKE_VERTICAL_SCALE,

            /** No scale */
            STROKE_NO_SCALE
        };
    }
}


/* -------------------------------------------------- Macros / Constants */

/**
 * @def   TWIPS_PER_PIXEL
 *
 * @brief Twips is defined as twentieth of a pixel.
 */
#define TWIPS_PER_PIXEL 20


/* -------------------------------------------------- Structs / Unions */

namespace DOM
{
    namespace Utils
    {

        /**
         * @struct COLOR
         *
         * @brief  Defines a color in RGBA format.
         */
        struct COLOR
        {
            /** Red component (Value can range from 0-255) */
            FCM::Byte red;

            /** Green component (Value can range from 0-255) */
            FCM::Byte green;

            /** Blue component (Value can range from 0-255) */
            FCM::Byte blue;

            /** Alpha component (Value can range from 0-255) */
            FCM::Byte alpha;
        };


        /**
         * @struct MATRIX2D
         *
         * @brief  Represents a transformation matrix.
         */
        struct MATRIX2D
        {
            /** Represents the scale factor for the object's x-axis */
            FCM::Float a;

            /** Represents the vertical skew of an object */ 
            FCM::Float b;

            /** Represents the horizontal skew of an object */
            FCM::Float c;

            /** Represents the scale factor for the object's y-axis */
            FCM::Float d;

            /** Represents the x translation of the transformation */
            FCM::Float tx;

            /** Represents the y translation of the transformation */
            FCM::Float ty;
        };

		/**
		* @struct MATRIX3D
		*
		* @brief  Represents a 3d transformation matrix.
		* Assumes the matrix is in this format
		| m00 m01 m02 m03 |				| a  b  -   0 |
		| m10 m11 m12 m13 |   ======>   | c  d  -   0 |
		| m20 m21 m22 m23 |				| -  -  -   0 |
		| m30 m31 m32 m33 | 			| tx ty	tz  1 |				
		*/
		struct MATRIX3D
		{
			FCM::Float m00;

			FCM::Float m01;

			FCM::Float m02;

			FCM::Float m03;

			FCM::Float m10;

			FCM::Float m11;

			FCM::Float m12;

			FCM::Float m13;

			FCM::Float m20;

			FCM::Float m21;

			FCM::Float m22;

			FCM::Float m23;

			FCM::Float m30;

			FCM::Float m31;

			FCM::Float m32;

			FCM::Float m33;

			MATRIX3D(){ 
				m00 = 0.0, m01 = 0.0, m02 = 0.0, m03 = 0;
				m10 = 0.0, m11 = 0.0, m12 = 0.0, m13 = 0;
				m20 = 0.0, m21 = 0.0, m22 = 0.0, m23 = 0;
				m30 = 0.0, m31 = 0.0, m32 = 0.0, m33 = 0;
			}
		};

        /**
         * @struct POINT2D
         *
         * @brief  Represents a 2-dimensional point.
         */
        struct POINT2D
        {
            /** X co-ordinate of the point */
            FCM::Float x;

            /** Y co-ordinate of the point */        
            FCM::Float y;
        };


        /**
         * @struct COLOR_MATRIX
         *
         * @brief  Defines a color matrix which contitutes of matrix and a color array.
         *         Color Matrix is of the following form:
         *         [red-multiplier,                 0,                0,                 0,  red-additive, 
         *                       0,  green-mulitplier,                0,                 0,  green-additive,    
         *                       0,                 0,  blue-mulitplier,                 0,  blue-additive,      
         *                       0,                 0,                0,  alpha-multiplier,  alpha-additive]      
         */
        struct COLOR_MATRIX
        {
            union
            {
                struct 
                {
                    /** Color transformation in matrix form */
                    FCM::Float matrix[4][5];
                };
                struct 
                {
                    /** Color transformation in linear array form */
                    FCM::Float colorArray[20];
                };
            };
        };


        /**
         * @struct RECT
         *
         * @brief  Defines a rectangle.
         */
        struct RECT
        {
            /** Top-left point **/
            POINT2D topLeft;

            /** Bottom-right point **/
            POINT2D bottomRight;
        };


        /**
         * @struct LINE
         *
         * @brief  This structure represents a straight line. A line is defined 
         *         by two end-points.
         */
        struct LINE
        {
            /** End point 1 */
            POINT2D endPoint1;

            /** End point 2 */
            POINT2D endPoint2;
        };


        /**
         * @struct QUAD_BEZIER_CURVE
         *
         * @brief  This structure defines a quadratic bezier curve. A quadratic 
         *         bezier curve can be defined using two anchor points and one 
         *         control point.
         */
        struct QUAD_BEZIER_CURVE
        {
            /** Anchor point 1 */
            POINT2D anchor1;

            /** Control point */
            POINT2D control;

            /** Anchor point 2 */
            POINT2D anchor2;
        };


        /**
        * @struct CUBIC_BEZIER_CURVE
        *
        * @brief  This structure defines a cubic bezier curve. A cubic
        *         bezier curve can be defined using two anchor points and two
        *         control point.
        */
        struct CUBIC_BEZIER_CURVE
        {
            /** Anchor point 1 */
            POINT2D anchor1;

            /** Control point 1 */
            POINT2D control1;

            /** Control point 2 */
            POINT2D control2;
            
            /** Anchor point 2 */
            POINT2D anchor2;
        };


        /**
         * @struct SEGMENT
         *
         * @brief  This structure defines a segment. 
         */    
        struct SEGMENT
        {
            /** 
             * Size of this structure. This must be set by the client/caller to 
             * sizeof(SEGMENT).
             */
            FCM::U_Int32 structSize;

            /** Type of curve */
            SegmentType segmentType;

            union
            {
                /** Quadratic bezier curve */
                QUAD_BEZIER_CURVE quadBezierCurve;

                /** Cubic bezier curve */
                CUBIC_BEZIER_CURVE cubicBezierCurve;
                
                /** Straight line */
                LINE line;
            };
        };


        /**
         * @struct GRADIENT_COLOR_POINT
         *
         * @brief  Map of a color and its position in the gradient.
         */
        struct GRADIENT_COLOR_POINT
        {
            /** Color */
            COLOR color;

            /** Position of the color in the gradient */
            FCM::U_Int8 pos;
        };
        
        /**
         * @struct RIG_PROPERTIES
         *
         * @brief  structure for layer parenting properties
         */
        struct RIG_PROPERTIES
        {
            /** rig matrix */
            MATRIX2D matrix;
        };
    }
}


/* -------------------------------------------------- Class Decl */


/* -------------------------------------------------- Inline / Functions */


#include "FCMPostConfig.h"

#endif // DOM_TYPES_H_

