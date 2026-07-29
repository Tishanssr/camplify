import mongoose from 'mongoose'

const groupChecklistSchema = new mongoose.Schema(
  {
    trip: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'trip',
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    icon: {
      type: String,
      default: '⛺',
    },
    items: [
      {
        name: { type: String, required: true },
        done: { type: Boolean, default: false },
        assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
        assignedName: String,
        weight: String,
      },
    ],
  },
  { timestamps: true }
)

const groupChecklistModel = mongoose.models.groupChecklist || mongoose.model('groupChecklist', groupChecklistSchema)
export default groupChecklistModel
