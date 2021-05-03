const mongoose = require("mongoose");
const {Schema} = mongoose;
const {isEmail} = require("validator");
const {generatePasswordHash} = require("../utils");
const differenceInMinutes = require("date-fns/differenceInMinutes");

const UserSchema = new Schema({
    email: {
        type: String,
        require: "Email address is required",
        validate: [isEmail, "Invalid email"],
        unique: true,
    },
    fullname: {
        type: String,
        required: "Fullname is required",
    },
    password: {
        type: String,
        required: "Password is required",
    },
    confirmed: {
        type: Boolean,
        default: false,
    },
    avatar: String,
    confirmHash: String,
    lastSeen: {
        type: Date,
        default: new Date(),
    },
}, {
    timestamps: true
});

UserSchema.virtual("isOnline").get(function () {
    return differenceInMinutes(new Date(), this.lastSeen) < 5;
});

UserSchema.set("toJSON", {
    virtuals: true,
});

UserSchema.pre("save", async function (next) {
    const user = this;
    if (!user.isModified("password")) {
        return next();
    }

    user.password = await generatePasswordHash(user.password);
    user.confirmHash = await generatePasswordHash(new Date().toString());
})

const UserModel = mongoose.model("User", UserSchema, "user");

module.exports = UserModel;
