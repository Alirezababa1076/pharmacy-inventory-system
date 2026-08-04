import mongoose from 'mongoose';

const drugSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'نام دارو الزامی است'],
      trim: true,
    },
    brand: {
      type: String,
      trim: true,
      default: 'نامشخص',
    },
    dosageForm: {
      type: String,
      required: [true, 'شکل دارو الزامی است'],
      enum: ['قرص', 'کپسول', 'آمپول', 'ویال', 'سرم', 'پماد/کرم', 'شربت', 'قطره', 'اسپری', 'شیاف', 'سایر'],
      default: 'قرص',
    },
    unit: {
      type: String,
      enum: ['عدد', 'بسته', 'ورق', 'شیشه', 'تیوپ', 'باکس'],
      default: 'عدد',
    },
    dose: {
      type: String,
      default: '-',
    },
    location: {
      type: String,
      default: 'نامشخص',
    },
    minQuantity: {
      type: Number,
      default: 10,
    },
  },
  {
    timestamps: true,
  }
);

const Drug = mongoose.model('Drug', drugSchema);

export default Drug;