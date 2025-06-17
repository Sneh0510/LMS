import { Webhook } from "svix";
import User from "../models/User.js";
import Razorpay from "razorpay";
import { Purchase } from "../models/Purchase.js";
import Course from "../models/Course.js";
import { createHmac } from 'crypto';

// Clerk Webhook
export const clerkWebhooks = async (req, res) => {
  try {
    const whook = new Webhook(process.env.CLERK_WEBHOOK_SECRET);
    await whook.verify(JSON.stringify(req.body), {
      "svix-id": req.headers["svix-id"],
      "svix-timestamp": req.headers["svix-timestamp"],
      "svix-signature": req.headers["svix-signature"],
    });

    const { data, type } = req.body;

    switch (type) {
      case "user.created": {
        const userData = {
          _id: data.id,
          email: data.email_addresses[0].email_address,
          name: data.first_name + " " + data.last_name,
          imageUrl: data.image_url,
        };
        await User.create(userData);
        res.json({});
        break;
      }

      case "user.updated": {
        const userData = {
          email: data.email_addresses[0].email_address,
          name: data.first_name + " " + data.last_name,
          imageUrl: data.image_url,
        };
        await User.findByIdAndUpdate(data.id, userData);
        res.json({});
        break;
      }

      case "user.deleted": {
        await User.findByIdAndDelete(data.id);
        res.json({});
        break;
      }

      default:
        res.status(400).json({ success: false, message: "Unhandled event type" });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Razorpay instance
const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Razorpay Webhook
export const razorWebhooks = async (req, res) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const signature = req.headers["x-razorpay-signature"];

  try {
    // Ensure req.body is a Buffer
    const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body));

    const expectedSignature = createHmac("sha256", secret)
      .update(rawBody)
      .digest("hex");

    if (expectedSignature !== signature) {
      return res.status(400).json({ success: false, message: "Invalid signature" });
    }

    const event = JSON.parse(rawBody.toString()); // Razorpay sends raw body

    console.log("📨 Webhook Event:", event.event);

    switch (event.event) {
      case "payment.captured": {
        const payment = event.payload.payment.entity;
        const purchaseId = payment.notes?.purchaseId;

        if (!purchaseId) {
          console.log("❌ Purchase ID not found in payment notes.");
          break;
        }

        const purchaseData = await Purchase.findById(purchaseId);
        if (!purchaseData) {
          console.log("❌ Purchase data not found.");
          break;
        }

        const userData = await User.findById(purchaseData.userId);
        const courseData = await Course.findById(purchaseData.courseId);

        if (!userData || !courseData) {
          console.log("❌ Invalid user or course data.");
          break;
        }

        if (!courseData.enrolledStudents.includes(userData._id)) {
          courseData.enrolledStudents.push(userData._id);
          await courseData.save();
          console.log("✅ User enrolled in course.");
        }

        if (!userData.enrolledCourses.includes(courseData._id.toString())) {
          userData.enrolledCourses.push(courseData._id.toString());
          await userData.save();
          console.log("✅ Course added to user.");
        }

        purchaseData.status = "completed";
        await purchaseData.save();
        console.log("✅ Purchase marked as completed.");
        break;
      }

      case "payment.failed": {
        const payment = event.payload.payment.entity;
        const purchaseId = payment.notes?.purchaseId;

        if (!purchaseId) {
          console.log("❌ Purchase ID not found in failed payment notes.");
          break;
        }

        const purchaseData = await Purchase.findById(purchaseId);
        if (purchaseData) {
          purchaseData.status = "failed";
          await purchaseData.save();
          console.log("❌ Purchase marked as failed.");
        }

        break;
      }

      default:
        console.log(`⚠️ Unhandled event type: ${event.event}`);
    }

    res.status(200).json({ success: true, received: true });
  } catch (error) {
    console.error("❌ Webhook Error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};
