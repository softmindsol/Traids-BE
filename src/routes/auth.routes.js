import express from "express";
import {
  login,
  registerCompany,
  registerSubcontractor,
} from "../controllers/auth.controller.js";
import { upload } from "../middelware/multer.middleware.js";

const router = express.Router();

router.post(
  "/register/company",
  upload.fields([
    { name: "companyDocument", maxCount: 1 },
    { name: "insuranceCertificate", maxCount: 1 },
    { name: "healthSafetyPolicy", maxCount: 1 }
  ]),
  registerCompany
);
router.post(
  "/register/subcontractor",
  upload.fields([
    { name: "profilePhoto", maxCount: 1 },
    { name: "workExamples", maxCount: 5 },
    { name: "certifications", maxCount: 5 } // new
  ]),
  registerSubcontractor
);
router.post("/login", login);

export default router;
