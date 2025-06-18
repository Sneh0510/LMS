import express from 'express'
import {  addUserRating, becomeEducator, getUserCourseProgress, getUserData, purchaseCourse, updateUserCourseProgress, userEnrolledCourses } from '../controllers/userController.js'
import { requireAuth } from '@clerk/express'
const userRouter = express.Router()

userRouter.get('/data' , getUserData)
userRouter.get('/enrolled-courses' , userEnrolledCourses)
userRouter.post('/purchase' , purchaseCourse)
userRouter.post('/update-course-progress', updateUserCourseProgress)
userRouter.post('/get-course-progress', getUserCourseProgress)
userRouter.post('/add-rating', addUserRating)
userRouter.put('/become-educator', requireAuth(), becomeEducator)

export default userRouter