import Course from "../models/Course.js"
import { CourseProgress } from "../models/CourseProgress.js"
import User from "../models/User.js"
import { Purchase } from "../models/Purchase.js";
import razorpay from 'razorpay';
import mongoose from "mongoose";
import { clerkClient } from "@clerk/express";

// get user data

export const getUserData = async (req, res) => {
  try {
    const { userId } = req.auth();
    const user = await User.findById(userId).lean();

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const userInfo = {
      _id: user._id,
      name: user.name,
      email: user.email,
      imageUrl: user.imageUrl,
      role: user.role,
      enrolledCourses: user.enrolledCourses || [],
      uploadedCourses: user.uploadedCourses || [],
      totalEarnings: user.totalEarnings || 0,
    };

    res.status(200).json({ success: true, user: userInfo });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// user enrolled course with lecture links

export const userEnrolledCourses = async (req, res) => {
  try {
    const { userId } = req.auth();

    const userData = await User.findById(userId).populate('enrolledCourses');

    if (!userData) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, enrolledCourses: userData.enrolledCourses });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// update the role of the user
export const becomeEducator = async (req, res) => {
  try {
    const { userId } = req.auth();

    // 1. Update role in Clerk
    await clerkClient.users.updateUser(userId, {
      publicMetadata: {
        role: "educator",
      },
    });

    // 2. Update role in your DB
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    user.role = "educator";
    user.uploadedCourses = [];
    user.totalEarnings = 0;
    await user.save();

    res.status(200).json({ success: true, message: "You are now an educator!" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
 
// Purchase Course
export const purchaseCourse = async (req, res) => {
    try {
        const { courseId } = req.body;
        const { origin } = req.headers;
        const { userId } = req.auth();

        // Fetch user and course data
        const userData = await User.findById(userId);
        const courseData = await Course.findById(courseId);

        if (!userData || !courseData) {
            return res.json({ success: false, message: "Data Not Found" });
        }

        // Calculate discounted amount
        const amount = (
            courseData.coursePrice - (courseData.discount * courseData.coursePrice) / 100
        ).toFixed(2);

        // Create purchase record in DB
        const purchaseData = {
            courseId: courseData._id,
            userId,
            amount,
        };

        const newPurchase = await Purchase.create(purchaseData);

        // Razorpay initialization (✅ Corrected here)
        const razorpayInstance = new razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET,
        });

        const currency = (process.env.CURRENCY || "INR").toUpperCase();

        // Razorpay order options
        const options = {
            amount: Math.floor(amount * 100), // convert to paisa
            currency,
            receipt: newPurchase._id.toString(),
            payment_capture: 1,
            notes: {
                courseTitle: courseData.courseTitle,
                purchaseId: newPurchase._id.toString(),
            },
        };

        // Create order on Razorpay
        const order = await razorpayInstance.orders.create(options);

        // Send response to frontend
        res.json({
            success: true,
            order: {
                id: order.id,
                amount: order.amount,
                currency: order.currency,
                receipt: order.receipt,
                notes: order.notes,
            },
            razorpayKeyId: process.env.RAZORPAY_KEY_ID,
            success_url: `${origin}/loading/my-enrollments`,
            cancel_url: `${origin}/`,
        });

    } catch (error) {
        console.error("Purchase Course Error:", JSON.stringify(error, null, 2));
        res.json({ success: false, message: error?.message || JSON.stringify(error) || "Something went wrong" });
    }
};



// update use course Progress

export const updateUserCourseProgress = async (req, res) => {
    try {
        const { userId } = req.auth();
        const { courseId, lectureId } = req.body
        const progressData = await CourseProgress.findOne({ userId, courseId })

        if (progressData) {
            if (progressData.lectureCompleted.includes(lectureId)) {
                return res.json({ success: true, message: 'Lecture Already Completed' })
            }

            progressData.lectureCompleted.push(lectureId)
            await progressData.save()
        } else {
            await CourseProgress.create({
                userId, courseId, lectureCompleted: [lectureId]
            })
        }

        res.json({ success: true, message: 'Progress Updated' })

    } catch (error) {
        res.json({ success: true, message: error.message })
    }
}

// get user course progress

export const getUserCourseProgress = async (req, res) => {
    try {
        const { userId } = req.auth();
        const { courseId } = req.body
        const progressData = await CourseProgress.findOne({ userId, courseId })

        res.json({ success: true, progressData })

    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

// add user rating to course

export const addUserRating = async (req, res) => {
    const { userId } = req.auth();
    const { courseId, rating } = req.body

    if (!courseId || !userId || !rating || rating < 1 || rating > 5) {
        return res.json({ success: false, message: 'Invalid Details' });
    }

    try {
        const course = await Course.findById(courseId);

        if (!course) {
            return res.json({ success: false, message: 'Course not found' });
        }

        const user = await User.findById(userId)

        if (!user || !user.enrolledCourses.includes(courseId)) {
            return res.json({ success: false, message: 'User has not purchased this course.' });
        }

        const existingRatingIndex = course.courseRatings.findIndex(r => r.userId === userId)

        if (existingRatingIndex > -1) {
            course.courseRatings[existingRatingIndex].rating = rating;
        } else {
            course.courseRatings.push({ userId, rating });
        }
        await course.save();

        return res.json({ success: true, message: 'Rating added' })

    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}