import mongoose from 'mongoose'

const tripSchema = new mongoose.Schema(
  {
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    location: {
      type: String,
      required: true,
    },
    coordinates: {
      lat: Number,
      lng: Number,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    meetingPoint: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['upcoming', 'planning', 'completed', 'cancelled'],
      default: 'planning',
    },
    image: {
      type: String,
      default: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1200&q=85',
    },
    participants: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
        email: String,
        role: { type: String, enum: ['organizer', 'participant'], default: 'participant' },
        status: { type: String, enum: ['confirmed', 'pending', 'rejected', 'declined'], default: 'pending' },
      },
    ],
    readiness: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
)

const tripModel = mongoose.models.trip || mongoose.model('trip', tripSchema)
export default tripModel
