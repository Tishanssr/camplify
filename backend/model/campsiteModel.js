import mongoose from 'mongoose'

const campsiteSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: '',
    },
    rating: {
      type: Number,
      default: 4.8,
    },
    reviewsCount: {
      type: Number,
      default: 10,
    },
    distance: {
      type: String,
      default: 'Nearby',
    },
    tags: [String],
    image: {
      type: String,
      default: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1200&q=85',
    },
    coordinates: {
      lat: Number,
      lng: Number,
    },
  },
  { timestamps: true }
)

const campsiteModel = mongoose.models.campsite || mongoose.model('campsite', campsiteSchema)
export default campsiteModel
