import mongoose from 'mongoose'

const personalChecklistSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user',
      required: true,
    },
    items: [
      {
        name: { type: String, required: true },
        done: { type: Boolean, default: false },
      },
    ],
  },
  { timestamps: true }
)

const personalChecklistModel = mongoose.models.personalChecklist || mongoose.model('personalChecklist', personalChecklistSchema)
export default personalChecklistModel
