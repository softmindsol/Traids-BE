import express from "express";

import { upload } from "../middelware/multer.middleware.js";
import { deleteJob, getAllJobsForSubcontractor, getCompanyJobs, postJob, updateJob } from "../controllers/jobpost.controller.js";
import { verifyJWT } from "../middelware/auth.middleware.js";

const router = express.Router();
router.post("/create-job", verifyJWT, upload.array("jobDocuments", 5), postJob);
router.get("/get-jobs", verifyJWT, getCompanyJobs);

router.delete("/delete-jobs/:jobId", verifyJWT, deleteJob);
router.put(
  "/update-jobs/:jobId",
  verifyJWT,
  upload.array("jobDocuments", 5),
  updateJob
);

router.get("/get-jobs-subcontractor", verifyJWT, getAllJobsForSubcontractor);
export default router;
