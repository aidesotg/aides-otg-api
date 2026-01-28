import * as mongoose from 'mongoose';
import { Favorite } from '../interface/favorite.interface';

export const CallRecordingSchema = new mongoose.Schema<Favorite>(
    {
        day_log: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'ServiceRequestDayLogs',
        },
        day_id: {
            type: String
        },
        recording_url: {
            type: String,
        },
        call_sid: {
            type: String,
        },
        recording_duration: {
            type: Number,
        },
        recording_status: {
            type: String,
            enum: ['completed', 'failed', 'in-progress'],
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    },
);

CallRecordingSchema.method('toJSON', function () {
    const { __v, ...object } = this.toObject();
    return object;
});
