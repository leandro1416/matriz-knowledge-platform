import mongoose from 'mongoose';

const blockSchema = new mongoose.Schema({
    userId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    prompt:   { type: String, required: true },
    answer:   { type: String, required: true },
    prevHash: { type: String, default: null },
    hash:     { type: String, required: true, unique: true },
    ts:       { type: Date,   default: Date.now }
});

export default mongoose.model('Block', blockSchema); 