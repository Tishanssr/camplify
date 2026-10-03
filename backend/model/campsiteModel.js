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

    distance: {
      type: String,
      default: 'Nearby',
    },
    tags: [String],
    image: {
      type: String,
      default: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1200&q=85',
    },
    images: {
      type: [String],
      default: [],
    },
    coordinates: {
      lat: Number,
      lng: Number,
    },
    offlineMapKey: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
)

const campsiteModel = mongoose.models.campsites || mongoose.model('campsites', campsiteSchema)
export default campsiteModel
