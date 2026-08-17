import mongoose from 'mongoose'

const groupChecklistSchema = new mongoose.Schema(
  {
    trip: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'trip',
      required: true,
      unique: true,
    },
    items: [
      {
        name: { type: String, required: true },
        done: { type: Boolean, default: false },
        assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
        assignedName: String,
        quantity: { type: String, default: '1' },
      },
    ],
  },
  { timestamps: true }
)

const groupChecklistModel = mongoose.models.groupChecklist || mongoose.model('groupChecklist', groupChecklistSchema)
export default groupChecklistModel
