import mongoose from 'mongoose';

const inboundSchema = new mongoose.Schema(
  {
    drug: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Drug',
      required: true,
    },
    inboundDate: {
      type: Date,
      default: Date.now, // تاریخ ورود به انبار
    },
    expiryDate: {
      type: Date,
      required: [true, 'تاریخ انقضا الزامی است'],
    },
    initialQuantity: {
      type: Number,
      required: true,
      min: 1,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0, // تعداد باقی‌مانده از این سری ورود
    },
  },
  {
    timestamps: true,
  }
);

const Inbound = mongoose.model('Inbound', inboundSchema);

export default Inbound;