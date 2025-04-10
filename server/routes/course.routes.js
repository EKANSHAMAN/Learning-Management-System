import {Router} from "express";

import {
  getAllCourses,
  getLecturesByCourseId,
  createCourse,
  updateCourseById,
  deleteCourseById,
  addLectureToCourseById,
  removeLectureFromCourse,
} from "../controllers/course.controller.js";
import {
  isLoggedIn,
  authorizedRoles,
  authorizeSubscriber,
} from "../middlewares/auth.middleware.js";

import upload from "../middlewares/multer.middleware.js";

const router = Router();

router
  .route("/")
  .get(getAllCourses)
  .post(
    isLoggedIn,
    authorizedRoles('ADMIN'),
    upload.single("thumbnail"), 
    createCourse);

router
  .route("/:id")
  .get(isLoggedIn, authorizeSubscriber, getLecturesByCourseId)
  .put(isLoggedIn, authorizedRoles("ADMIN"), updateCourseById)
  .delete(isLoggedIn, authorizedRoles("ADMIN"), removeLectureFromCourse)
  .post(
    isLoggedIn,
    authorizedRoles("ADMIN"),
    upload.single("lecture"),
    addLectureToCourseById
  );
  router.delete(
    "/:courseId/lecture/:lectureId",
    isLoggedIn,
    authorizedRoles("ADMIN"),
    removeLectureFromCourse
  );

export default router;