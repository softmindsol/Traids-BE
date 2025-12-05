import mongoose from "mongoose";

const companyProfileSchema = new mongoose.Schema({
  companyName: { type: String },
  registrationNumber: { type: String },
  vatNumber: { type: String },
  industryType: { type: String }, // select options
  primaryContactName: { type: String },
  workEmail: { type: String },
  phoneNumber: { type: String },
  headOfficeAddress: { type: String },

  // Document Verification
  companyDocument: { type: String },      // file URL
  insuranceCertificate: { type: String }, // file URL
  healthSafetyPolicy: { type: String },   // file URL
}, { _id: false });


const subcontractorProfileSchema = new mongoose.Schema({
  fullName: { type: String },
  primaryTrade: { type: String },  // select option
  yearsExperience: { type: Number },
  postcode: { type: String },
  certifications: [{ type: String }],

  // Profile Details
  profilePhoto: { type: String },
  dayRate: { type: Number },
  availability: { type: String },
  professionalBio: { type: String },

  // Work examples
  workExamples: [{ type: String }],

  // Rating fields
  rating: {
    type: Number,
    default: 0,     // average rating
    min: 0,
    max: 5
  },
  totalReviews: {
    type: Number,
    default: 0
  }

}, { _id: false });



const userSchema = new mongoose.Schema({
  // SHARED FIELDS
  email: { type: String, required: true, unique: true },
  password: { type: String }, // if you plan email+password auth
  phone: { type: String },
  role: {
    type: String,
    enum: ["company", "subcontractor"],
    required: true,
  },

  // VERIFICATION & ACCOUNT STATUS
  isVerified: { type: Boolean, default: false },
  status: {
    type: String,
    enum: ["pending", "active", "suspended"],
    default: "pending",
  },

  // STRIPE FIELDS (future)
  stripeCustomerId: { type: String },             // for company (payer)
  stripeConnectedAccountId: { type: String },     // for subcontractor (receiver)

  // ROLE-BASED PROFILES
  companyProfile: companyProfileSchema,
  subcontractorProfile: subcontractorProfileSchema,

}, { timestamps: true });


const User = mongoose.model("User", userSchema);

export default User;
