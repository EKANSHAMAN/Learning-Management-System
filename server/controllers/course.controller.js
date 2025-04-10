import fs from "fs/promises";
import path from "path";
import cloudinary from "cloudinary";

import asyncHandler from "../middlewares/asyncHandler.middleware.js";
import Course from "../models/course.model.js";
import AppError from "../utils/error.utils.js";

const uploadDir = path.resolve("server/server/uploads");

export const getAllCourses = asyncHandler(async (req, res, next) => {
  const courses = await Course.find({}).select("-lectures");

  res.status(200).json({
    success: true,
    message: "All courses",
    courses,
  });
});

export const createCourse = asyncHandler(async (req, res, next) => {
  const { title, description, category, createdBy } = req.body;

  if (!title || !description || !category || !createdBy) {
    return next(new AppError("All fields are required", 400));
  }

  const course = await Course.create({
    title,
    description,
    category,
    createdBy,
  });

  if (!course) {
    return next(
      new AppError("Course could not be created, please try again", 400)
    );
  }

  if (req.file) {
    try {
      const result = await cloudinary.v2.uploader.upload(req.file.path, {
        folder: "lms",
      });

      if (result) {
        course.thumbnail.public_id = result.public_id;
        course.thumbnail.secure_url = result.secure_url;
      }

      await fs.rm(path.join(uploadDir, req.file.filename));
    } catch (error) {
      for (const file of await fs.readdir(uploadDir)) {
        await fs.unlink(path.join(uploadDir, file));
      }

      return next(
        new AppError(
          JSON.stringify(error) || "File not uploaded, please try again",
          400
        )
      );
    }
  }

  await course.save();

  res.status(201).json({
    success: true,
    message: "Course created successfully",
    course,
  });
});

export const getLecturesByCourseId = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const course = await Course.findById(id);

  if (!course) {
    return next(new AppError("Invalid course id or course not found.", 404));
  }

  res.status(200).json({
    success: true,
    message: "Course lectures fetched successfully",
    lectures: course.lectures,
  });
});

export const addLectureToCourseById = asyncHandler(async (req, res, next) => {
  const { title, description } = req.body;
  const { id } = req.params;

  let lectureData = {};

  if (!title || !description) {
    return next(new AppError("Title and Description are required", 400));
  }

  const course = await Course.findById(id);

  if (!course) {
    return next(new AppError("Invalid course id or course not found.", 400));
  }

  if (req.file) {
    try {
      const result = await cloudinary.v2.uploader.upload(req.file.path, {
        folder: "lms",
        chunk_size: 50000000,
        resource_type: "video",
      });

      if (result) {
        lectureData.public_id = result.public_id;
        lectureData.secure_url = result.secure_url;
      }

      await fs.rm(path.join(uploadDir, req.file.filename));
    } catch (error) {
      for (const file of await fs.readdir(uploadDir)) {
        await fs.unlink(path.join(uploadDir, file));
      }

      return next(
        new AppError(
          JSON.stringify(error) || "File not uploaded, please try again",
          400
        )
      );
    }
  }

  course.lectures.push({
    title,
    description,
    lecture: lectureData,
  });

  course.numberOfLectures = course.lectures.length;

  await course.save();

  res.status(200).json({
    success: true,
    message: "Course lecture added successfully",
    course,
  });
});

export const removeLectureFromCourse = asyncHandler(async (req, res, next) => {
  const { courseId, lectureId } = req.params;

  console.log("✅ Received courseId:", courseId);
  console.log("✅ Received lectureId:", lectureId);

  if (!courseId) return next(new AppError("Course ID is required", 400));
  if (!lectureId) return next(new AppError("Lecture ID is required", 400));

  const course = await Course.findById(courseId);

  if (!course)
    return next(new AppError("Invalid ID or Course does not exist.", 404));

  console.log(
    "📚 All lecture IDs in course:",
    course.lectures.map((lec) => lec._id.toString())
  );

  const lectureIndex = course.lectures.findIndex(
    (lecture) => lecture._id.toString() === lectureId.toString()
  );

  console.log("🔍 Matched lectureIndex:", lectureIndex);

  if (lectureIndex === -1)
    return next(new AppError("Lecture does not exist.", 404));

  await cloudinary.v2.uploader.destroy(
    course.lectures[lectureIndex].lecture.public_id,
    {
      resource_type: "video",
    }
  );

  course.lectures.splice(lectureIndex, 1);
  course.numberOfLectures = course.lectures.length;
  await course.save();

  res.status(200).json({
    success: true,
    message: "Course lecture removed successfully",
  });
});

export const updateCourseById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const course = await Course.findByIdAndUpdate(
    id,
    {
      $set: req.body,
    },
    {
      runValidators: true,
    }
  );

  if (!course) {
    return next(new AppError("Invalid course id or course not found.", 400));
  }

  res.status(200).json({
    success: true,
    message: "Course updated successfully",
  });
});

export const deleteCourseById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const course = await Course.findById(id);

  if (!course) {
    return next(new AppError("Course with given id does not exist.", 404));
  }

  await course.remove();

  res.status(200).json({
    success: true,
    message: "Course deleted successfully",
  });
});
