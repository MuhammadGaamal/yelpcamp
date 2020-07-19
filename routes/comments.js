var express = require("express");
var router = express.Router({mergeParams: true});
var Campgrounds = require("../models/campground");
var Comment = require("../models/comment");
var middleware = require("../middleware");

// Comment New
router.get("/new", middleware.isLoggedIn,function (req, res) {
    //find campground by id
    Campgrounds.findById(req.params.id, function (err, campground) {
        if(err || !campground){
            req.flash("error", "Campground Not Found");
            res.redirect("back");
        }else {
            res.render("comments/newform", {campground: campground});
        }
    })
});
// Comment Create
router.post("/", middleware.isLoggedIn,function (req, res) {
    //lookup using id
    Campgrounds.findById(req.params.id, function (err, campground) {
        if(err){
            console.log(err);

        }else {
            Comment.create(req.body.comment, function (err, comment) {
                if(err){
                    console.log(err);
                }else{
                    //add username and id to comment
                    comment.author.id = req.user._id;
                    comment.author.username = req.user.username;
                    //save comment
                    comment.save();
                    campground.comments.push(comment);
                    campground.save();
                    res.redirect("/campgrounds/" + campground._id);
                }
            });
        }
    });
});
//Edit route
router.get("/:comment_id/edit", middleware.commentsAuthorization ,function (req, res) {
    Campgrounds.findById(req.params.id, function (err, foundcampground) {
        if(err || !foundcampground){
            req.flash("error", "Can't find that campground");
            return res.redirect("back");
        }
        Comment.findById(req.params.comment_id, function (err, findcomment) {
            if(err || !findcomment){
                req.flash("error", "Comment Not Found");
                res.redirect("back");
            }else{
                res.render("comments/edit", {campground_id: req.params.id, comment: findcomment });
            }
        });
    });
});
//update route
router.put("/:comment_id", middleware.commentsAuthorization ,function (req, res) {
    req.body.comment.body = req.sanitize(req.body.comment.body);
    Comment.findByIdAndUpdate(req.params.comment_id, req.body.comment, function (err, updatedcomment) {
        if(err){
            res.redirect("back");
        }else {
            res.redirect("/campgrounds/" +req.params.id);
        }
    });
});
// Delete route
router.delete("/:comment_id", middleware.commentsAuthorization ,function (req, res) {
    Comment.findByIdAndRemove(req.params.comment_id, function (err, deletedcomment) {
        if(err){
            res.redirect("back");
        }else{
            res.redirect("/campgrounds/" + req.params.id);
        }
    });
});

module.exports = router;
