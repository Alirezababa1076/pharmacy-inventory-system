import mongoose from 'mongoose';

const outboundSchema = new mongoose.Schema(
  {
    drug: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Drug',
    },
    drugName: String,
    drugBrand: String,
    dosageForm: String,
    totalQuantity: {
      type: Number,
      required: true,
    },
    outboundDate: {
      type: Date,
      default: Date.now,
    },
    notes: {
      type: String,
      default: '',
    },
    breakdown: [
      {
        inboundId: { type: mongoose.Schema.Types.ObjectId, ref: 'Inbound' },
        expiryDate: Date,
        quantityDeducted: Number,
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Outbound = mongoose.model('Outbound', outboundSchema);

export default Outbound;