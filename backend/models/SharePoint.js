const mongoose = require("mongoose")

const sharePointSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    link: {
      type: String,
      required: true,
      trim: true,
    },

    comment: {
      type: String,
      trim: true,
      maxlength: 1000,
    },

    deadline: {
      type: Date,
      required: true,
    },

    creationDate: {
      type: Date,
      default: Date.now,
      immutable: true,
    },

    // Enhanced approval system
    managersToApprove: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],

    managerApproved: {
      type: Boolean,
      default: false,
    },

    approvedAt: {
      type: Date,
    },

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // Enhanced user signing with external users and disapproval
    usersToSign: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: function () {
            return !this.isExternal
          },
        },
        externalEmail: {
          type: String,
          required: function () {
            return this.isExternal
          },
        },
        isExternal: {
          type: Boolean,
          default: false,
        },
        hasSigned: {
          type: Boolean,
          default: false,
        },
        signedAt: {
          type: Date,
        },
        signatureNote: {
          type: String,
          trim: true,
          maxlength: 500,
        },
        hasDisapproved: {
          type: Boolean,
          default: false,
        },
        disapprovedAt: {
          type: Date,
        },
        disapprovalNote: {
          type: String,
          trim: true,
          maxlength: 500,
        },
        invitationSent: {
          type: Boolean,
          default: false,
        },
        invitationSentAt: {
          type: Date,
        },
      },
    ],

    // Document-level disapproval tracking
    disapprovalNote: {
      type: String,
      trim: true,
      maxlength: 1000,
    },

    updateHistory: [
      {
        action: {
          type: String,
          enum: [
            "created",
            "updated",
            "signed",
            "approved",
            "rejected",
            "disapproved",
            "relaunched",
            "deadline_extended",
          ],
          required: true,
        },
        performedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
        details: {
          type: String,
          trim: true,
        },
        previousValues: {
          type: mongoose.Schema.Types.Mixed,
        },
      },
    ],

    status: {
      type: String,
      enum: [
        "pending_approval",
        "pending",
        "in_progress",
        "completed",
        "expired",
        "cancelled",
        "rejected",
        "disapproved",
      ],
      default: "pending_approval",
    },

    fileMetadata: {
      fileName: String,
      fileSize: Number,
      fileType: String,
      lastModified: Date,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
)

sharePointSchema.virtual("allUsersSigned").get(function () {
  return this.usersToSign.length > 0 && this.usersToSign.every((user) => user.hasSigned)
})

sharePointSchema.virtual("hasDisapprovals").get(function () {
  return this.usersToSign.some((user) => user.hasDisapproved)
})

sharePointSchema.virtual("completionPercentage").get(function () {
  if (this.usersToSign.length === 0) return 0
  const signedCount = this.usersToSign.filter((user) => user.hasSigned).length
  return Math.round((signedCount / this.usersToSign.length) * 100)
})

// Enhanced pre-save middleware to handle the new workflow with disapprovals
sharePointSchema.pre("save", function (next) {
  // Check for disapprovals first
  if (this.hasDisapprovals) {
    this.status = "disapproved"
  } else if (this.status !== "rejected" && this.status !== "pending_approval") {
    if (!this.managerApproved) {
      this.status = "pending_approval"
    } else {
      // Manager has approved, now check signing status
      if (this.allUsersSigned) {
        this.status = "completed"
      } else if (this.usersToSign.some((user) => user.hasSigned)) {
        this.status = "in_progress"
      } else {
        this.status = "pending" // Approved but no signatures yet
      }

      // Check for expiration
      if (new Date() > this.deadline && this.status !== "completed") {
        this.status = "expired"
      }
    }
  }

  next()
})

sharePointSchema.index({ createdBy: 1, status: 1 })
sharePointSchema.index({ deadline: 1 })
sharePointSchema.index({ "usersToSign.user": 1 })
sharePointSchema.index({ "usersToSign.externalEmail": 1 })
sharePointSchema.index({ managersToApprove: 1 })
sharePointSchema.index({ managerApproved: 1 })

module.exports = mongoose.model("SharePoint", sharePointSchema)
