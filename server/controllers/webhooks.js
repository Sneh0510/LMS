import { Webhook } from "svix";
import User from "../models/User.js";
import Razorpay from "razorpay";
import { Purchase } from "../models/Purchase.js";
import Course from "../models/Course.js";
import { createHmac } from 'crypto';

//api controller function to manage clerk user with database

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
        break;
    }
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Razorpay instance (you can keep it in case you want to use later, not needed for webhook directly)
const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export const razorWebhooks = async (req, res) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const signature = req.headers["x-razorpay-signature"];
  const payload = req.body; // if body is raw

  // ✅ Verify Razorpay webhook signature
  const expectedSignature = createHmac("sha256", secret)
  .update(payload)
  .digest("hex");


  if (expectedSignature !== signature) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid signature" });
  }

  const event = req.body;

  try {
    switch (event.event) {
      case "payment.captured": {
        const payment = event.payload.payment.entity;
        const purchaseId = payment.notes?.purchaseId;

        if (!purchaseId) {
          console.log("❌ Purchase ID not found in payment notes.");
          break;
        }

        const purchaseData = await Purchase.findById(purchaseId);
        const userData = await User.findById(purchaseData?.userId);
        const courseData = await Course.findById(purchaseData?.courseId);

        console.log("📦 Purchase:", purchaseData);
        console.log("👤 User:", userData);
        console.log("📚 Course:", courseData);

        if (!purchaseData || !userData || !courseData) {
          return res
            .status(400)
            .json({ success: false, message: "Invalid data in webhook" });
        }

        if (!courseData.enrolledStudents.includes(userData._id)) {
          courseData.enrolledStudents.push(userData._id);
          await courseData.save();
          console.log("✅ User added to course.");
        }

        if (!userData.enrolledCourses.includes(courseData._id.toString())) {
          userData.enrolledCourses.push(courseData._id.toString());
          await userData.save();
          console.log("✅ Course added to user.", userData.enrolledCourses);
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
          console.log("Purchase ID not found in failed payment notes.");
          break;
        }

        const purchaseData = await Purchase.findById(purchaseId);
        if (purchaseData) {
          purchaseData.status = "failed";
          await purchaseData.save();
        }

        break;
      }

      default:
        console.log(`Unhandled event type: ${event.event}`);
    }

    res.status(200).json({ success: true, received: true });
  } catch (error) {
    console.error("Webhook handler error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};
