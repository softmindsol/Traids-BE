import mongoose from "mongoose";

const jobSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    jobTitle: { type: String, required: true },
    tradeRequired: { type: String, required: true },
    description: { type: String, required: true },
    siteAddress: { type: String, required: true },

    timeline: {
      start: { type: Date, required: true },
      end: { type: Date, required: true },
    },

    dayRate: { type: Number, required: true },
    workersNeeded: { type: Number, required: true },
    jobDocuments: [
      {
        url: String,
        publicId: String,
      },
    ],

    status: {
      type: String,
      enum: ["pending", "accepted", "completed", "cancelled", "active"],
      default: "pending",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Job", jobSchema);
