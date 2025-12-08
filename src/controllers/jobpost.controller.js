import { deleteFromCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js";
import Job from "../models/Job.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
export const postJob = asyncHandler(async (req, res) => {
  const {
    jobTitle,
    tradeRequired,
    description,
    siteAddress,
    timelineStart,
    timelineEnd,
    dayRate,
    workersNeeded,
  } = req.body;

  if (req.user.role !== "company") {
    throw new ApiError(403, "Only company accounts can post jobs");
  }

  if (
    !jobTitle ||
    !tradeRequired ||
    !description ||
    !siteAddress ||
    !timelineStart ||
    !timelineEnd ||
    !dayRate ||
    !workersNeeded
  ) {
    throw new ApiError(400, "Missing required fields");
  }

  // Handle file uploads
  let jobDocuments = [];
  if (req.files && req.files.length > 0) {
    for (let file of req.files) {
      const uploaded = await uploadOnCloudinary(file.path);
      if (uploaded) {
        jobDocuments.push({
          url: uploaded.secure_url,
          publicId: uploaded.public_id,
        });
      }
    }
  }

  const job = await Job.create({
    companyId: req.user._id,

    jobTitle,
    tradeRequired,
    description,
    siteAddress,
    dayRate,
    workersNeeded,

    timeline: {
      start: new Date(timelineStart),
      end: new Date(timelineEnd),
    },

    jobDocuments,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, job, "Job posted successfully"));
});

export const getCompanyJobs = asyncHandler(async (req, res) => {
  if (req.user.role !== "company") {
    throw new ApiError(403, "Only companies can view their jobs");
  }

  const jobs = await Job.find({ companyId: req.user._id }).sort({ createdAt: -1 });

  return res
    .status(200)
    .json(new ApiResponse(200, jobs, "Company jobs fetched successfully"));
});

export const deleteJob = asyncHandler(async (req, res) => {
  const { jobId } = req.params;

  if (req.user.role !== "company") {
    throw new ApiError(403, "Only companies can delete jobs");
  }

  const job = await Job.findOne({ _id: jobId, companyId: req.user._id });
  if (!job) {
    throw new ApiError(404, "Job not found or not owned by you");
  }

  // Delete Cloudinary documents
  if (job.jobDocuments && job.jobDocuments.length > 0) {
    for (let doc of job.jobDocuments) {
      await deleteFromCloudinary(doc.publicId);
    }
  }

  await job.deleteOne();

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Job deleted successfully"));
});


export const updateJob = asyncHandler(async (req, res) => {
  const { jobId } = req.params;

  if (req.user.role !== "company") {
    throw new ApiError(403, "Only companies can update jobs");
  }

  const job = await Job.findOne({ _id: jobId, companyId: req.user._id });
  if (!job) {
    throw new ApiError(404, "Job not found or not owned by you");
  }

  const {
    jobTitle,
    tradeRequired,
    description,
    siteAddress,
    timelineStart,
    timelineEnd,
    dayRate,
    workersNeeded,
  } = req.body;

  // If new documents uploaded, delete old & upload new
  let newDocuments = job.jobDocuments;

  if (req.files && req.files.length > 0) {
    // delete old documents
    for (let oldDoc of job.jobDocuments) {
      await deleteFromCloudinary(oldDoc.publicId);
    }

    newDocuments = [];

    for (let file of req.files) {
      const uploaded = await uploadOnCloudinary(file.path);
      if (uploaded) {
        newDocuments.push({
          url: uploaded.secure_url,
          publicId: uploaded.public_id,
        });
      }
    }
  }

  // Update fields
  job.jobTitle = jobTitle || job.jobTitle;
  job.tradeRequired = tradeRequired || job.tradeRequired;
  job.description = description || job.description;
  job.siteAddress = siteAddress || job.siteAddress;
  job.dayRate = dayRate || job.dayRate;
  job.workersNeeded = workersNeeded || job.workersNeeded;

  if (timelineStart || timelineEnd) {
    job.timeline = {
      start: timelineStart ? new Date(timelineStart) : job.timeline.start,
      end: timelineEnd ? new Date(timelineEnd) : job.timeline.end,
    };
  }

  job.jobDocuments = newDocuments;

  await job.save();

  return res
    .status(200)
    .json(new ApiResponse(200, job, "Job updated successfully"));
});


export const getAllJobsForSubcontractor = asyncHandler(async (req, res) => {
  
  // Fetch all active jobs (you can add filters later if needed)
  const jobs = await Job.find()
    .populate("company", "companyName") // optional: show company name only
    .select("-__v");

  return res.status(200).json({
    success: true,
    count: jobs.length,
    data: jobs,
  });
});