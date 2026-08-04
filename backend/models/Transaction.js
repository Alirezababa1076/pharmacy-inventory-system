import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema(
  {
    drug: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Drug',
      required: true,
    },
    type: {
      type: String,
      enum: ['IN', 'OUT'], // IN: ورود به انبار | OUT: خروج از انبار
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    notes: {
      type: String, // مثلاً: خروج روزانه، فاکتور خرید، مرجوعی و...
    },
  },
  {
    timestamps: true,
  }
);

const Transaction = mongoose.model('Transaction', transactionSchema);

export default Transaction;