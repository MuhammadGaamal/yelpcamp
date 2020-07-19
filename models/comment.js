var mongoose = require("mongoose");

// setup the schema
var commentSchema = new mongoose.Schema({
    text: String,
    CreatedAt: { type: Date, default: Date.now},
    author: {
        id:{
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        username: String
    }
});
module.exports = mongoose.model("Comment", commentSchema);
