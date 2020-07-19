var middlewareobj ={};
var Campgrounds = require("../models/campground");
var Comment     = require("../models/comment");
var Review = require("../models/review");


middlewareobj.campgroundAuthorization = function (req, res, next){
        if(req.isAuthenticated()){
            Campgrounds.findById(req.params.id, function (err, findcampground) {
                if(err || !findcampground){
                    req.flash("error", "Campground not found")
                    res.redirect("back");
                }else {
                    // does the user own that campground
                    // .equals because we compare an object with a string
                    if(findcampground.author.id.equals(req.user._id)  || req.user.isAdmin){
                        next();
                    }else {
                        // otherwise, redirect back
                        req.flash("error", "You're not authorized!");
                        res.redirect("back");
                    }
                }
            });
        }else{
            // if not, redirect back
            req.flash("error", "You're not authorized!");
            res.redirect("back");
        }
}

middlewareobj.commentsAuthorization = function (req, res, next){
        if(req.isAuthenticated()){
            Comment.findById(req.params.comment_id, function (err, findcomment) {
                if(err || !findcomment){
                    req.flash("error", "Comment Not Found");
                    res.redirect("back");
                }else {
                    // does the user own that comment
                    // .equals because we compare an object with a string
                    if(findcomment.author.id.equals(req.user._id) || req.user.isAdmin){
                        next();
                    }else {
                        // otherwise, redirect back
                        req.flash("error", "You're not authorized!");
                        res.redirect("back");
                    }
                }
            });
        }else{
            // if not, redirect back
            req.flash("error", "You're not authorized!");
            res.redirect("back");
        }
}

middlewareobj.isLoggedIn = function (req, res, next){
        if(req.isAuthenticated()){
            return next();
        }
        req.flash("error", "Please Login First!");
        res.redirect("/login");
}
middlewareobj.checkReviewOwnership = function(req, res, next) {
    if(req.isAuthenticated()){
        Review.findById(req.params.review_id, function(err, foundReview){
            if(err || !foundReview){
                res.redirect("back");
            }  else {
                // does user own the comment?
                if(foundReview.author.id.equals(req.user._id)) {
                    next();
                } else {
                    req.flash("error", "You don't have permission to do that");
                    res.redirect("back");
                }
            }
        });
    } else {
        req.flash("error", "You need to be logged in to do that");
        res.redirect("back");
    }
};

middlewareobj.checkReviewExistence = function (req, res, next) {
    if (req.isAuthenticated()) {
        Campgrounds.findById(req.params.id).populate("reviews").exec(function (err, foundCampground) {
            if (err || !foundCampground) {
                req.flash("error", "Campground not found.");
                res.redirect("back");
            } else {
                // check if req.user._id exists in foundCampground.reviews
                var foundUserReview = foundCampground.reviews.some(function (review) {
                    return review.author.id.equals(req.user._id);
                });
                if (foundUserReview) {
                    req.flash("error", "You already wrote a review.");
                    return res.redirect("/campgrounds/" + foundCampground._id);
                }
                // if the review was not found, go to the next middleware
                next();
            }
        });
    } else {
        req.flash("error", "You need to login first.");
        res.redirect("back");
    }
};
module.exports = middlewareobj;
