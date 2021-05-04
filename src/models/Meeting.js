const mongoose = require("mongoose");
const {Schema} = mongoose;

const MeetingSchema = new Schema({
    subject: {
        type: String,
        require: "Meeting subject is required",
        unique: true,
    },
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User",
        require: true,
    },
    participants: [{
        type: Schema.Types.ObjectId,
        ref: "User",
    }],
    useVideo: {
        type: Boolean,
    },
}, {
    timestamps: true
});

const MeetingModel = mongoose.model("Meeting", MeetingSchema, "meeting");

module.exports = MeetingModel;
