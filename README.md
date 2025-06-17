<h1 align="center">🎓 Edemy LMS</h1>
<p align="center">
  <img src="https://img.shields.io/badge/React-18-blue?logo=react" />
  <img src="https://img.shields.io/badge/Node.js-18-green?logo=node.js" />
  <img src="https://img.shields.io/badge/MongoDB-6.0-brightgreen?logo=mongodb" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-3.0-38bdf8?logo=tailwindcss" />
  <img src="https://img.shields.io/badge/Clerk-Auth-orange?logo=clerk" />
  <img src="https://img.shields.io/badge/Razorpay-Payments-blueviolet?logo=razorpay" />
</p>

<p align="center">
  <b>A modern, full-stack Learning Management System for educators and students.</b><br>
  <i>Build, teach, learn, and grow with Edemy!</i>
</p>

---

## ✨ Features

- **👨‍🎓 Student Portal**
  - Browse and enroll in courses
  - Watch video lectures (with free previews)
  - Track course and lecture completion
  - View course details, ratings, and testimonials

- **👩‍🏫 Educator Portal**
  - Create and manage courses, chapters, and lectures
  - Upload course thumbnails and video content
  - View enrolled students and earnings

- **🔐 Authentication**
  - Secure login/signup with Clerk
  - Role-based access for students and educators

- **💳 Payments**
  - Integration with Razorpay for course purchases

- **📱 Responsive UI**
  - Built with Tailwind CSS for a modern, mobile-friendly experience

---

## 🛠️ Tech Stack

- **Frontend:**
  - React
  - Vite
  - Tailwind CSS

- **Backend:**
  - Node.js
  - Express.js

- **Database:**
  - MongoDB

- **Authentication:**
  - Clerk

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v16+)
- [MongoDB](https://www.mongodb.com/) instance (local or cloud)
- [Clerk](https://clerk.com/) account (for authentication)
- [Cloudinary](https://cloudinary.com/) account (for file uploads)
- [Razorpay](https://razorpay.com/) account (for payments)

### Setup

#### 1. Clone the repository

```sh
git clone https://github.com/Sneh0510/LMS.git
cd LMS
```

#### 2. Install dependencies

```sh
cd client
npm install
cd ../server
npm install
```

#### 3. Configure Environment Variables

Create `.env` files in both `client/` and `server/` directories.

**server/.env**
```
MONGODB_URI = YOUR_MONGODB_URI
CLERK_WEBHOOK_SECRET = YOUR_CLERK_WEBHOOK_SECRET
CLERK_PUBLISHABLE_KEY = YOUR_CLERK_PUBLISHABLE_KEY
CLERK_SECRET_KEY = YOUR_CLERK_SECRET_KEY
CLOUDINARY_NAME = YOUR_CLOUDINARY_NAME
CLOUDINARY_API_KEY = YOUR_CLOUDINARY_API_KEY
CLOUDINARY_SECRET_KEY = YOUR_CLOUDINARY_SECRET_KEY
RAZORPAY_KEY_ID = YOUR_RAZORPAY_KEY_ID
RAZORPAY_KEY_SECRET = YOUR_RAZORPAY_KEY_SECRET
CURRENCY= YOUR_CURRENCY
RAZORPAY_WEBHOOK_SECRET = YOUR_RAZORPAY_WEBHOOK_SECRET
```

**client/.env**
```
VITE_CLERK_PUBLISHABLE_KEY = YOUR_VITE_CLERK_PUBLISHABLE_KEY
VITE_CURRENCY = YOUR_VITE_CURRENCY
VITE_BACKEND_URL = http://localhost:5000
```

#### 4. Run the Development Servers

- **Backend:**

  ```sh
  cd server
  npm run server
  ```

- **Frontend:**

  ```sh
  cd client
  npm run dev
  ```

Visit [http://localhost:5173](http://localhost:5173) to view the app.

---

## 🌐 Deployment

- Ready for deployment on [Vercel](https://vercel.com/) (see `vercel.json` in both `client/` and `server/`).
- Configure environment variables in your deployment dashboard.

---

## 📄 License

This project is licensed under the MIT License.

---

<p align="center"><b>Made with ❤️ by Sneh Yadav
