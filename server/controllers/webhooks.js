import { Webhook } from "svix";
import User from "../models/User.js";
import Razorpay from "razorpay";
import { Purchase } from "../models/Purchase.js";
import Course from "../models/Course.js";

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

// Razorpay instance (not required here unless you're using it elsewhere)
const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export const razorWebhooks = async (req, res) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const signature = req.headers["x-razorpay-signature"];
  const payload = JSON.stringify(req.body);

  // Validate signature
  const expectedSignature = crypto
    .createHmac("sha256", secret)
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
        const purchaseId = payment.notes.purchaseId;

        const purchaseData = await Purchase.findById(purchaseId);
        const userData = await User.findById(purchaseData.userId);
        const courseData = await Course.findById(
          purchaseData.courseId.toString()
        );

        if (!purchaseData || !userData || !courseData) {
          console.log("Invalid data during webhook handling");
          break;
        }

        // Enroll user
        courseData.enrolledStudents.push(userData._id);
        await courseData.save();

        userData.enrolledCourses.push(courseData._id);
        await userData.save();

        purchaseData.status = "completed";
        await purchaseData.save();

        break;
      }

      case "payment.failed": {
        const payment = event.payload.payment.entity;
        const purchaseId = payment.notes.purchaseId;

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
