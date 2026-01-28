import * as mongoose from 'mongoose';

export interface CallRecording extends mongoose.Document {
    readonly id: string;
    day_log: mongoose.Schema.Types.ObjectId;
    day_id: string;
    recording_url: string;
    call_sid: string;
    recording_duration: number;
    recording_status: string;
    created_at: Date;
    updated_at: Date;
}
