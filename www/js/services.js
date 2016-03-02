angular.module('your_app_name.services', [])

.service('userService', function($rootScope,$q) {
 	this.loggedUser = {};
  this.userLoggedIn = false;
	this.validateUsername = function(username) {
		if (typeof username == 'undefined') {return false;}
    if (username.length < 4) {return false;}
		var usernameReg = /^[a-zA-Z0-9_-]{3,16}$/;
		return usernameReg.test(username);
	};
	this.validateEmail = function(email) {
		if (typeof email == 'undefined') {return false;}
		var emailReg = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
		return emailReg.test(email);
	};
	this.validatePassword = function(password) {
		if (typeof password == 'undefined') {return false;}
    if (password.length < 6) {return false;}
		else {return true;}
	};
	this.Register = function(user) {
    var deferred = $q.defer();
    $rootScope.show('Registering...');
    console.log('Registering... ' + JSON.stringify(user.username.toLowerCase()) );
    var User = new Parse.User();
    User.set("username", user.username.toLowerCase());
    User.set("email", user.email.toLowerCase());
		User.set("password", user.password);
    User.signUp(null, {
	    success: function(user) {
	      deferred.resolve(user);
        $rootScope.hide();
	    },
	    error: function(user, error) {
        console.log(JSON.stringify(error));
				deferred.reject(error.message);
        $rootScope.hide();
	    }
    });
		return deferred.promise;
	};
  this.updateUsername = function(username) {
    $rootScope.show('Updating Username...');
    var deferred = $q.defer();
    var user = Parse.User.current();
    user.set("username", username);
    user.save(null, {
      success: function(user) {
        deferred.resolve(user);
        $rootScope.hide();
      },
      error: function(user, error) {
        console.error(JSON.stringify(error));
        deferred.reject(error.message);
        $rootScope.hide();
      }
    });
    return deferred.promise;
  };
  this.updatePassword = function(username,password) {
    $rootScope.show('Updating Password...');
    var deferred = $q.defer();
    var user = Parse.User.current();
    user.set("password", password);
    user.save(null, {
      success: function(user) {
        Parse.User.logOut();
        Parse.User.logIn(username.toLowerCase(),password, {
          success: function(user) {
            deferred.resolve(user);
            $rootScope.hide();
          },
        	error: function(user, error) {
            console.error(JSON.stringify(error));
            deferred.reject(error.message);
            $rootScope.hide();
          }
        });
        $rootScope.hide();
      },
      error: function(user, error) {
        console.error(JSON.stringify(error));
        deferred.reject(error.message);
        $rootScope.hide();
      }
    });
    return deferred.promise;
  };
	this.Login = function(loginData) {
    var deferred = $q.defer();
		$rootScope.show('Logging in');
    Parse.User.logIn((''+loginData.username).toLowerCase(),loginData.password, {
      success: function(user) {
        deferred.resolve(user);
        $rootScope.hide();
      },
    	error: function(user, error) {
        console.error(JSON.stringify(error));
        deferred.reject(error.message);
        $rootScope.hide();
      }
    });
		return deferred.promise;
  };
  this.getUserDetails = function(userId){
    var deferred = $q.defer();
    var UserDetails = Parse.Object.extend("User"),
    query = new Parse.Query(UserDetails);
    query.equalTo("objectId", userId);
    query.find({
      success: function(Details) {
        var result = {};
        result.username = Details[0].get("username");
        deferred.resolve(result);
      },
      error: function(error) {
        console.error(JSON.stringify(error));
        deferred.reject(error);
      }
    });
    return deferred.promise;
  };
})



.service('postService', function ($q, $rootScope){
  this.likedPictures   = [];
  this.geolocations    = [];
  this.userPictures    = [];
  this.modalPictures   = [];
  this.followPictures  = [];
  this.tempPicture     = {};
  this.southwestOfSF   = null;
  this.northeastOfSF   = null;
  this.newgeolocation  = null;
  var incrementReports = function(Picture, value){
    var deferred = $q.defer();
    Picture.increment("reports", value);
    Picture.save({
      success: function(results) {
        deferred.resolve(results);
      },
      error: function(error) {
        console.error("incrementReports ERROR::::::::> " + JSON.stringify(error));
        deferred.reject(error);
      }
    });
    return deferred.promise;
  };
  this.Report = function(Picture) {
    var deferred = $q.defer();
    var ReportObj = Parse.Object.extend("Reports");
    var Report = new ReportObj();
    Report.set("picture", Picture);
    Report.set("user", Parse.User.current());
    Report.save(null, {
      success: function(myObject) {
        incrementReports(Picture,1)
        .then(function(result) {
        });
        deferred.resolve(myObject);
      },
      error: function(myObject, error) {
        console.error("REPORTING ERROR ::::: " + JSON.stringify(error));
        deferred.reject(error);
      }
    });
    return deferred.promise;
  };
  var incrementLikes = function(Picture, value){
    var deferred = $q.defer();
    Picture.increment("likes", value);
    Picture.save({
      success: function(results) {
        deferred.resolve(results);
      },
      error: function(error) {
        console.error("incrementLikes ERROR::::::::> " + JSON.stringify(error));
        deferred.reject(error);
      }
    });
    return deferred.promise;
  };
  var incrementFollowers = function(geolocation, value){
    var deferred = $q.defer();
    geolocation.increment("followers", value);
    geolocation.save({
      success: function(results) {
        deferred.resolve(results);
      },
      error: function(error) {
        console.error("incrementFollowers FOLLOWING INCREMENT ERROR::::::::> " + JSON.stringify(error));
        deferred.reject(error);
      }
    });
    return deferred.promise;
  };
  this.getLikedPictures = function(){
    var Likes = Parse.Object.extend("Likes");
    var query = new Parse.Query(Likes);
    query.equalTo("user", Parse.User.current());
    query.select("picture");
    query.limit(1000);
    query.find({
      success: function(likes) {
        Likes = [];
        likes.forEach(function(like) {
          Likes.push(like.get("picture").id);
        });
        this.likedPictures = Likes;
        //console.log("Initial Like Load ::: this.likedPictures ::: " + JSON.stringify(this.likedPictures) );
      },
      error: function(error) {
        console.error("Error getLikedPictures " + JSON.stringify(error));
      }
    });
  };
  this.emptyLikedPictures = function(){
    EmptyLikes();
  };
  var EmptyLikes = function(){
    this.likedPictures = [];
  };
  var AddNewLike = function(Picture){
    this.likedPictures = this.likedPictures.concat(Picture.id);
  };
  var RemoveLike = function(Picture){
    this.likedPictures = _.without(this.likedPictures, Picture.id);
  };
  var isPictureLiked = function(Picture){
    return (_.indexOf(this.likedPictures, Picture.id) >= 0);
  };
  var likePictureIn = function(Picture, Posts){
    var match = _.find(Posts, function(item) {
      return item.picture.id === Picture.id;
    });
    if (match) {
      match.picture.liked = true;
      match.picture.likes = match.picture.likes + 1;
    }
  };
  var unlikePictureIn = function(Picture, Posts){
    var match = _.find(Posts, function(item) {
      return item.picture.id === Picture.id;
    });
    if (match) {
      match.picture.liked = false;
      match.picture.likes = match.picture.likes - 1;
    }
  };
  this.incrementGeoPicCount = function(geolocation, value) {
    geolocation.increment("picCount", value);
    geolocation.save();
  };
  this.Follow = function(geolocation) {
    var deferred = $q.defer();
    var FollowObj = Parse.Object.extend("Following");
    var following = new FollowObj();
    following.set("geolocation", geolocation);
    following.set("user", Parse.User.current());
    following.save(null, {
      success: function(myObject) {
        incrementFollowers(geolocation,1).then(function(result) {
        });
        deferred.resolve(myObject);
      },
      error: function(myObject, error) {
        console.error("FOLLOWING ERROR ::::: " + JSON.stringify(error));
        deferred.reject(error);
      }
    });
    return deferred.promise;
  };
  this.unFollow = function(geolocation) {
    var deferred = $q.defer();
    var FollowObj = Parse.Object.extend("Following");
    query = new Parse.Query(FollowObj);
    query.equalTo("geolocation", geolocation);
    query.equalTo("user", Parse.User.current());
    query.find(
    {
    success: function(following)
    {
      following[0].destroy({
        success: function(myObject) {
          incrementFollowers(geolocation,-1)
          .then(function(result) {
          });
          deferred.resolve(myObject);
        },
        error: function(myObject, error) {
          console.error("UNFOLLOW RES ERROR <<<<<<<<<<-----------::: " + JSON.stringify(error));
          deferred.reject(error);
        }
      });
    },
    error: function(error) {
      console.error("UNFOLLOW ERROR: " + JSON.stringify(error));
      deferred.reject(error);
    }
    });
    return deferred.promise;
  };
  this.Like = function(Picture) {
    if (!isPictureLiked(Picture)) {
      likePictureIn(Picture, this.userPictures);
      likePictureIn(Picture, this.modalPictures);
      likePictureIn(Picture, this.geolocations);
      likePictureIn(Picture, this.followPictures);
      AddNewLike(Picture);
      var deferred = $q.defer();
      var LikeObj = Parse.Object.extend("Likes");
      var Like = new LikeObj();
      Like.set("picture", Picture);
      Like.set("user", Parse.User.current());
      Like.save(null, {
        success: function(newlike) {
          incrementLikes(Picture,1).then(function(result) {
          });
          deferred.resolve(newlike);
        },
        error: function(newlike, error) {
          console.error("LIKING ERROR ::::: " + JSON.stringify(error));
          deferred.reject(error);
        }
      });
      return deferred.promise;
    }
  };
  this.unLike = function(Picture) {
    unlikePictureIn(Picture, this.userPictures);
    unlikePictureIn(Picture, this.modalPictures);
    unlikePictureIn(Picture, this.geolocations);
    unlikePictureIn(Picture, this.followPictures);
    RemoveLike(Picture);
    var deferred = $q.defer();
    var Likes = Parse.Object.extend("Likes");
    query = new Parse.Query(Likes);
    query.equalTo("picture", Picture);
    query.equalTo("user", Parse.User.current());
    query.find(
    {
    success: function(likes)
    {
      likes[0].destroy({
        success: function(myObject) {
          incrementLikes(Picture,-1).then(function(result) {
          });
          deferred.resolve(myObject);
        },
        error: function(myObject, error) {
          console.error("UNLIKING RES ERROR <<<<<<<<<<-----------::: " + JSON.stringify(error));
          deferred.reject(error);
        }
      });
    },
    error: function(error) {
      console.error("UNLIKE ERROR: " + JSON.stringify(error));
      deferred.reject(error);
    }
    });
    return deferred.promise;
  };
  this.isGeoFollowedbyUser = function(geolocation){
    var deferred = $q.defer();
    query = new Parse.Query("Following");
    query.equalTo("geolocation", geolocation);
    query.equalTo("user", Parse.User.current());
    query.find({
      success: function(results) {
        if (results.length) {
          deferred.resolve(true);
        }
        else {
          deferred.resolve(false);
        }
      },
      error: function(error) {
        console.error(JSON.stringify(error));
        deferred.reject(error);
      }
    });
    return deferred.promise;
  };
  this.getMapFeed = function(southwestOfSF, northeastOfSF){
    var deferred = $q.defer();
    var geolocations = Parse.Object.extend("Geolocations");
    var query = new Parse.Query(geolocations);
    query.equalTo("approved", true);
    query.include("user");
    query.withinGeoBox("geolocation", southwestOfSF, northeastOfSF);
    query.limit(100);
    query.find({
      success: function(geolocations) {
        deferred.resolve(geolocations);
      },
      error: function(error) {
        deferred.reject(error);
        console.error("ERRRRROOOOOORRRRR getMapFeed " + JSON.stringify(error));
      }
    });
    return deferred.promise;
  };
  this.getGeoFeed = function(page){
    var pageSize = 10,
        skip = pageSize * (page-1),
        deferred = $q.defer();
    var geolocations = Parse.Object.extend("Geolocations");
    var query = new Parse.Query(geolocations);
    query.equalTo("approved", true);
    query.include("picture");
    query.include("user");
    if (this.southwestOfSF && this.northeastOfSF) {
      query.withinGeoBox("geolocation", this.southwestOfSF, this.northeastOfSF);
    }
    //console.log("getGeoFeed ::::::::: Geo Pos: " + JSON.stringify(this.southwestOfSF) + " " + JSON.stringify(this.northeastOfSF) );
    query.descending("createdAt");
    query.skip(skip);
    query.limit(pageSize);
    query.find({
      success: function(Items) {
        console.log("getGeoFeed ::::::::: Total geolocations: " + Items.length);
        var Posts = [];
        Items.forEach(function(Item) {
          var Post = {};
          Post.geolocation = Item;
          Post.picture = Item.get("picture");
          Post.user = Item.get("user");
          Post.title = Item.get("title");
          Post.description = Item.get("picture").get("description");
          Post.picture.liked = isPictureLiked(Item.get("picture"));
          Post.picture.likes = Item.get("picture").get("likes");
          Posts.push(Post);
        });
        deferred.resolve(Posts);
      },
      error: function(error) {
        console.error("ERROR getGeoFeed ERROR : " + JSON.stringify(error));
        deferred.reject(error);
        $rootScope.hide();
      }
    });
    return deferred.promise;
  };
  this.getFollowPictures = function(page){
    var pageSize = 10,
        skip = pageSize * (page-1),
        deferred = $q.defer();
    var Following = Parse.Object.extend("Following");
    var innerQuery = new Parse.Query(Following);
    innerQuery.include("geolocation");
    innerQuery.equalTo("user", Parse.User.current() );
    var PicObj = Parse.Object.extend("Pictures"),
    query = new Parse.Query(PicObj);
    query.matchesKeyInQuery("geolocation", "geolocation", innerQuery);
    query.equalTo("approved", true);
    query.include("geolocation");
    query.include("user");
    query.descending("createdAt");
    query.skip(skip);
    query.limit(pageSize);
    query.find({
      success: function(Items) {
        console.log("getFollowPictures ::::::::: Total Pictures: " + Items.length);
        var Posts = [];
        Items.forEach(function(Item) {
          var Post = {};
          Post.picture = Item;
          Post.geolocation = Item.get("geolocation");
          Post.user = Item.get("user");
          Post.title = Item.get("geolocation").get("title");
          Post.description = Item.get("description");
          Post.picture.liked = isPictureLiked(Item);
          Post.picture.likes = Item.get("likes");
          Posts.push(Post);
        });
        deferred.resolve(Posts);
      },
      error: function(error) {
        console.error("ERROR getFollowPictures ERROR : " + JSON.stringify(error));
        deferred.reject(error);
      }
    });
    return deferred.promise;
  };
  this.getModalFeed = function(geolocation, page){
    var pageSize = 10,
        skip = pageSize * (page-1),
        deferred = $q.defer();
    console.log("getModalFeed geolocationId: " + geolocation.id);
    var picObject = Parse.Object.extend("Pictures"),
    query = new Parse.Query(picObject);
    query.equalTo("approved", true);
    query.equalTo("geolocation", geolocation);
    query.include("user");
    query.include("geolocation");
    query.ascending("createdAt");
    query.skip(skip);
    query.limit(pageSize);
    query.find({
      success: function(Items) {
        console.log("Total Modal geolocation Pictures: ", Items.length);
        var Posts = [];
        Items.forEach(function(Item) {
          var Post = {};
          Post.picture = Item;
          Post.user = Item.get("user");
          Post.geolocation = Item.get("geolocation");
          //Post.title = Item.get("geolocation").get("title");
          Post.description = Item.get("description");
          Post.picture.liked = isPictureLiked(Item);
          Post.picture.likes = Item.get("likes");
          Posts.push(Post);
        });
        deferred.resolve(Posts);
      },
      error: function(error) {
        console.error("ERROR getModalFeed ERROR : " + JSON.stringify(error));
        deferred.reject(error);
      }
    });
    return deferred.promise;
  };
  this.getUserPictures = function(page){
    var pageSize = 10,
        skip = pageSize * (page-1),
        deferred = $q.defer();
    var PicObj = Parse.Object.extend("Pictures"),
    query = new Parse.Query(PicObj);
    query.equalTo("approved", true);
    query.equalTo("user", Parse.User.current() );
    query.include("geolocation");
    query.include("user");
    query.descending("createdAt");
    query.skip(skip);
    query.limit(pageSize);
    query.find({
      success: function(Items) {
        console.log("getUserPictures ::::::::: Total Pictures: " + Items.length);
        var Posts = [];
        Items.forEach(function(Item) {
          var Post = {};
          Post.picture = Item;
          Post.geolocation = Item.get("geolocation");
          Post.user = Item.get("user");
          Post.title = Item.get("geolocation").get("title");
          Post.description = Item.get("description");
          Post.picture.liked = isPictureLiked(Item);
          Post.picture.likes = Item.get("likes");
          Posts.push(Post);
        });
        deferred.resolve(Posts);
      },
      error: function(error) {
        console.error("ERROR getUserPictures ERROR : " + JSON.stringify(error));
        deferred.reject(error);
      }
    });
    return deferred.promise;
  };
  this.deletePicture = function(post) {
    console.log("REMOVING PICTURE... " + JSON.stringify(post.picture));
    console.log("BEFORE REMOVING POST... " + JSON.stringify(this.userPictures.length));
    this.userPictures = _.without(this.userPictures, _.findWhere(this.userPictures,{picture:post.picture}));
    console.log("AFTER REMOVING POST... " + JSON.stringify(this.userPictures.length));
    this.removePicLikes(post.picture)
    .then(function(result){
      console.log("REMOVING LIKES... " + JSON.stringify(result));
    });
    this.removePicReports(post.picture)
    .then(function(result){
      console.log("REMOVING REPORTS... " + JSON.stringify(result));
    });
    post.picture.set("approved", false);
    //picture.set("likes", 0);
    //picture.set("reports", 0);
    post.picture.save(null, {
      success: function(result) {
        if (post.picture.id == post.geolocation.get("picture").id) {
          console.log("ROOT/First PICTURE DELETED");
          var PicObj = Parse.Object.extend("Pictures"),
          query = new Parse.Query(PicObj);
          query.equalTo("approved", true);
          query.equalTo("geolocation", post.geolocation);
          query.ascending("createdAt");
          query.limit(1);
          query.find({
            success: function(Item) {
              console.log("PIC________DELETION ::::::::: Total Pictures: " + JSON.stringify(Item));
              if (Item.length == 1) {
                post.geolocation.increment("picCount", -1);
                post.geolocation.set("picture", Item[0]);
                post.geolocation.set("user", Item[0].get("user"));
                post.geolocation.save(null, {
                  success: function(result) {
                    console.log("PIC________DELETION ::::::::: SHIFT_TO SUCCESS " + Item[0].id);
                  },
                  error: function(object, error) {
                    console.error("ERROR PICDELETE ::::: SHIFT_TO ERROR : " + JSON.stringify(error));
                  }
                });
              }
              else {
                post.geolocation.increment("picCount", -1);
                post.geolocation.set("approved", false);
                post.geolocation.save(null, {
                  success: function(result) {
                    console.log("PIC________DELETION ::::::::: SUCCESS ");
                  },
                  error: function(obj, error) {
                    console.error("ERROR PICDELETE ERROR : " + JSON.stringify(error));
                  }
                });
              }
            },
            error: function(error) {
              console.error("ERROR PIC_DEL ERROR : " + JSON.stringify(error));
            }
          });
        }
        else {
          post.geolocation.increment("picCount", -1);
          post.geolocation.save();
          console.log("PICTURE DELETION SUCCESS NOT THE ROOT PIC: " + JSON.stringify(result));
        }
      },
      error: function(myObject, error) {
        console.error("PICTURE DELETION ERROR::::::::> " + JSON.stringify(error));
      }
    });
  };
  this.removePicLikes = function(Picture) {
    var deferred = $q.defer();
    var Likes = Parse.Object.extend("Likes");
    query = new Parse.Query(Likes);
    query.equalTo("picture", Picture);
    query.find(
    {
    success: function(likes)
    {
      Parse.Object.destroyAll(likes, {
        success: function(result) {
          deferred.resolve(result);
        },
        error: function(myObject, error) {
          console.error(JSON.stringify(error));
          deferred.reject(error);
        }
      });
    },
    error: function(error) {
      console.error("DELETE REM ERROR: " + JSON.stringify(error));
      deferred.reject(error);
    }
    });
    return deferred.promise;
  };
  this.removePicReports = function(Picture) {
    var deferred = $q.defer();
    var Reports = Parse.Object.extend("Reports");
    query = new Parse.Query(Reports);
    query.equalTo("picture", Picture);
    query.find(
    {
    success: function(reports)
    {
      Parse.Object.destroyAll(reports, {
        success: function(result) {
          deferred.resolve(result);
        },
        error: function(myObject, error) {
          console.error(JSON.stringify(error));
          deferred.reject(error);
        }
      });
    },
    error: function(error) {
      console.error("REPORT REM ERROR: " + JSON.stringify(error));
      deferred.reject(error);
    }
    });
    return deferred.promise;
  };
  this.getPicture = function(picId){
    var deferred = $q.defer();
    var PicObj = Parse.Object.extend("Pictures"),
    query = new Parse.Query(PicObj);
    query.include("geolocation");
    query.get(picId, {
      success: function(picture) {
        deferred.resolve(picture);
      },
      error: function(error) {
        console.error(JSON.stringify(error));
        deferred.reject(error);
      }
    });
    return deferred.promise;
  };
  this.updatePicDescription = function(picId, description) {
    var match = _.find(this.userPictures, function(item) {
      return item.picture.id === picId;
    });
    if (match) {
      match.description = description;
    }
  };
  this.updateGeoTitle = function(geoId, title) {
    var matches = _.filter(this.userPictures, function(item) {
      return item.geolocation.id === geoId;
    });
    matches.forEach(function(match) {
      match.title = title;
    });
  };
})


.service('mapService', function() {
  var markers = [];
  var geomarkers = [];
  var longclickpos = {};
  var selectedGeoloc = null;
  this.addMarker = function(marker) {
    markers.push(marker);
  };
  this.addGeoMarker = function(marker) {
    geomarkers.push(marker);
  };
  this.removeAllMarkers = function () {
    markers.forEach(function(value) {
      value.remove();
    });
    markers = [];
  };
  this.removeAllGeoMarkers = function () {
    geomarkers.forEach(function(value) {
      value.remove();
    });
    geomarkers = [];
    this.longclickpos = {};
    console.log("removeAllGeoMarkers ::: " + JSON.stringify(this.longclickpos) );
  };
  this.hideAllInfoWindow = function () {
    markers.forEach(function(value) {
      value.hideInfoWindow();
    });
  };
})
;
