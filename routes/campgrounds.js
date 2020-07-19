require('dotenv').config();
var express = require("express");
var router = express.Router();
var Campgrounds = require("../models/campground");
var Comment = require("../models/comment");
var middleware = require("../middleware");
var Review = require("../models/review");

var multer = require("multer");
var storage = multer.diskStorage({
    filename: function(req, file, callback) {
        callback(null, Date.now() + file.originalname);
    }
});
var imageFilter = function (req, file, cb) {
    // accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new Error("Only image files are allowed!"), false);
    }
    cb(null, true);
};
var upload = multer({ storage: storage, fileFilter: imageFilter})
var cloudinary = require("cloudinary");
cloudinary.config({
    cloud_name: "dlhwxlvam",
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});


// Index route
router.get("/", function (req, res) {
// get all campgrounds from the database
//     Campgrounds.find({},
//         function (err, allcampgrounds) {
//             if(err){
//                 console.log("Couldn't retrieve campgrounds");
//             }else{
//                 res.render("campgrounds/campgrounds", {campgrounds: allcampgrounds, currentuser: req.user, page:"campgrounds"});
//             }
//         });
    var noMatch = null;
    if(req.query.search) {
        const regex = new RegExp(escapeRegex(req.query.search), 'gi');
        // Get all campgrounds from DB
        Campgrounds.find({name: regex}, function(err, allCampgrounds){
            if(err){
                console.log(err);
            } else {
                if(allCampgrounds.length < 1) {
                    noMatch = "No campgrounds match that query, please try again.";
                }
                res.render("campgrounds/campgrounds",{campgrounds:allCampgrounds, noMatch: noMatch});
            }
        });
    } else {
        // Get all campgrounds from DB
        Campgrounds.find({}, function(err, allCampgrounds){
            if(err){
                console.log(err);
            } else {
                res.render("campgrounds/campgrounds",{campgrounds:allCampgrounds, noMatch: noMatch});
            }
        });
    }
});

//Create route
router.post("/", middleware.isLoggedIn, upload.single("image") ,function (req, res) {
//     var name          = req.body.name,
//         image         = req.body.image,
//         desc          = req.body.description,
//         price         = req.body.price,
//         author        = {
//             id: req.user._id,
//             username: req.user.username
//         },
//         newCampground = {name: name, image: image, description: desc, price: price , author: author};
// // add new campground to the database and save it
//     Campgrounds.create(newCampground, function (err, newcampground) {
//         if(err){
//             console.log(err);
//         }else{
//             res.redirect("/campgrounds");
//         }
//     });
    cloudinary.v2.uploader.upload(req.file.path, function(err, result) {
        if(err) {
            req.flash('error', err.message);
            return res.redirect('back');
        }
        // add cloudinary url for the image to the campground object under image property
        req.body.campground.image = result.secure_url;
        // add image's public_id to campground object
        req.body.campground.imageId = result.public_id;
        // add author to campground
        req.body.campground.author = {
            id: req.user._id,
            username: req.user.username
        }
        Campgrounds.create(req.body.campground, function(err, campground) {
            if (err) {
                req.flash("error", err.message);
                return res.redirect("back");
            }
            res.redirect("/campgrounds/" + campground.id);
        });
    });
});
// New route
router.get("/new", middleware.isLoggedIn,function (req, res) {
    res.render("campgrounds/newform");
});

// Show route
router.get("/:id", middleware.isLoggedIn,function (req, res) {
    // find campground with specific ID
    Campgrounds.findById(req.params.id).populate("comments").populate({
        path: "reviews",
        options: {sort: {createdAt: -1}}
    }).exec(function (err, foundcampground) {
        if(err || !foundcampground){
            req.flash("error", "Campground Not Found");
            res.redirect("back");
        }else{
            console.log(foundcampground);
            //render the template of that campground
            res.render("campgrounds/show", {campgrounds: foundcampground});
        }
    });
});
//Edit route
router.get("/:id/edit", middleware.campgroundAuthorization ,function (req, res) {
        Campgrounds.findById(req.params.id, function (err, findcampground) {
            res.render("campgrounds/edit", {campgrounds: findcampground});
        });
});
//update route
router.put("/:id", middleware.campgroundAuthorization , upload.single("image") ,function (req, res) {
    // req.body.campgrounds.body = req.sanitize(req.body.campgrounds.body);
    Campgrounds.findById(req.params.id, async function(err, campground){
        if(err){
            req.flash("error", err.message);
            res.redirect("back");
        }else {
            if (req.file) {
                try {
                    await cloudinary.v2.uploader.destroy(campground.imageId);
                    var result = await cloudinary.v2.uploader.upload(req.file.path);
                    campground.imageId = result.public_id;
                    campground.image = result.secure_url;
                } catch(err) {
                    req.flash("error", err.message);
                    return res.redirect("back");
                }
            }
            campground.name = req.body.name;
            campground.description = req.body.description;
            campground.price = req.body.price;
            campground.save();
            req.flash("success","Successfully Updated!");
            res.redirect("/campgrounds/" +campground._id);
        }
    });
});
// Delete route
router.delete("/:id", middleware.campgroundAuthorization ,function (req, res) {
    Campgrounds.findById(req.params.id, async function(err, campground) {
        if(err) {
            req.flash("error", err.message);
            return res.redirect("back");
        } else {
            try {
                await cloudinary.v2.uploader.destroy(campground.imageId);
                // deletes all comments associated with the campground
                Comment.remove({"_id": {$in: campground.comments}}, function (err) {
                    if (err) {
                        console.log(err);
                        return res.redirect("/campgrounds");
                    }
                    // deletes all reviews associated with the campground
                    Review.remove({"_id": {$in: campground.reviews}}, function (err) {
                        if (err) {
                            console.log(err);
                            return res.redirect("/campgrounds");
                        }
                        //  delete the campground
                        campground.remove();
                        req.flash("success", "Campground deleted successfully!");
                        res.redirect("/campgrounds");
                    });
                });
            } catch (err) {
                if (err) {
                    req.flash("error", err.message);
                    return res.redirect("back");
                }
            }
        }
    });
});
function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};
module.exports = router;
