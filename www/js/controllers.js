angular.module('your_app_name.controllers', [])


.controller('WelcomeCtrl', function($scope, $state, userService, postService){
  console.log("---------------------------------------------------------------");
  console.log("WelcomeCtrl....");
	var currentUser = Parse.User.current();
	if (currentUser) {
    console.log("WelcomeCtrl: Logged User: " + JSON.stringify(currentUser.get("username") ));
    postService.getLikedPictures();
		userService.loggedUser = currentUser;
    userService.userLoggedIn = true;
    $state.go('app.map');
	}
	else {
		console.log("WelcomeCtrl: NO LOGGED USER");
    ionic.Platform.ready(function () {
      if(typeof plugin !== 'undefined') {
        console.log("WelcomeCtrl: Hidding the map in case it is open.");
        map = plugin.google.maps.Map.getMap();
        map.setVisible(false);
      }
    });
	}
})



.controller('RegisterCtrl', function($scope, $state, $ionicHistory, $ionicModal, userService){
  $ionicModal.fromTemplateUrl('views/app/legal/privacy-policy.html', {
    scope: $scope,
    animation: 'slide-in-up'
  }).then(function(modal) {
    $scope.privacy_policy_modal = modal;
  });
  $ionicModal.fromTemplateUrl('views/app/legal/terms-of-service.html', {
    scope: $scope,
    animation: 'slide-in-up'
  }).then(function(modal) {
    $scope.terms_of_service_modal = modal;
  });
  $scope.showPrivacyPolicy = function() {
    $scope.privacy_policy_modal.show();
  };
  $scope.showTerms = function() {
    $scope.terms_of_service_modal.show();
  };
  $scope.doRegister = function(){
    $scope.error = "";
    if ( userService.validateUsername($scope.user.username) ) {
      if ( userService.validateEmail($scope.user.email) ) {
        if ( userService.validatePassword($scope.user.password) ) {
          userService.Register($scope.user)
          .then(function (newuser) {
            userService.loggedUser = newuser;
        		userService.userLoggedIn = true;
            // Subscribe to receive a notification for this specific user (testing purpose):
            parsePlugin.subscribe("u_"+$scope.user.username, function() {
              console.log("RegisterCtrl ::: parsePlugin.subscribe");
            }, function(error) {
              console.error('RegisterCtrl ::: parsePlugin.subscribe ::: error: ' + JSON.stringify(error));
            });
            $ionicHistory.clearCache()
            .then(function(){
              $state.go('app.map');
            });
          }, function(error) {
            console.error("REGISTER ERROR: " + error);
            $scope.error = error;
          });
        }
        else {
          $scope.error = "Password invalid. Minimum 6 characters.";
        }
      }
      else {
        $scope.error = "Email invalid.";
      }
    }
    else {
      $scope.error = "Username invalid. Minimum 4 characters with no space nor special characters.";
    }
  };
  //////////////////////////////////////////////////////////////////
  $scope.$on('$ionicView.beforeEnter', function (event, viewData) {
    viewData.enableBack = true;
  });
  //////////////////////////////////////////////////////////////////
	$scope.user = {};
	$scope.error = "";
})



.controller('LoginCtrl', function($scope,$rootScope,$ionicHistory,$state,$ionicModal,userService,postService){
	$scope.doLogIn = function(){
		userService.Login($scope.user)
    .then(function(user) {
      userService.loggedUser = user;
			userService.userLoggedIn = true;
      console.log("LOGIN SUCCEED!");
      postService.getLikedPictures();
      $ionicHistory.clearCache()
      .then(function(){
        $state.go('app.map');
      });
    }, function (error) {
      $scope.error = error;
			console.log(JSON.stringify(error));
    });
	};
  $scope.showForgotPassword = function() {
    $scope.forgot_password_modal.show();
  };
	$scope.requestNewPassword = function() {
		$rootScope.show();
		$scope.message = "";
		$scope.error = "";
		Parse.User.requestPasswordReset($scope.user.email, {
			success: function(result) {
				console.log(JSON.stringify(result));
				$rootScope.hide();
				$scope.message = "You will receive an email with the instructions.";
			},
			error: function(error) {
        console.error(JSON.stringify(error));
				$rootScope.hide();
				$scope.error = error.message;
			}
		});
  };
  //////////////////////////////////////////////////////////////////
  $scope.$on('$ionicView.beforeEnter', function (event, viewData) {
    viewData.enableBack = true;
  });
  //////////////////////////////////////////////////////////////////
  console.log("--------------------------------------------------------------");
  console.log("LoginCtrl....");
  $scope.user = {};
  $ionicModal.fromTemplateUrl('views/auth/forgot-password.html', {
    scope: $scope,
    animation: 'slide-in-up'
  }).then(function(modal) {
    $scope.forgot_password_modal = modal;
  });
})




.controller('GeoFeedCtrl', function($scope, $rootScope, $cordovaSocialSharing, $ionicModal, $ionicPopup, $timeout, $ionicHistory, $state, $ionicScrollDelegate, $stateParams, postService, mapService, userService) {
  $ionicModal.fromTemplateUrl('views/app/geomodal.html', {
    scope: $scope,
    animation: 'slide-in-up'
  }).then(function(modal) {
    $scope.geo_modal = modal;
  });
  $scope.$on('$destroy', function() {
    $scope.geo_modal.remove();
  });
  $scope.showGeoModal = function(post, GeolocOwner) {
    console.log("GeoFeedCtrl opening the geolocation modal: " + post.geolocation.get("title") + " by " + GeolocOwner);
    $scope.modalGeoloc = post.geolocation;
    postService.isGeoFollowedbyUser(post.geolocation)
    .then(function(result) {
      $scope.following = result;
    });
    $scope.modalPage = 0;
    $scope.GeolocOwner = GeolocOwner;
    $scope.moreModalDataCanBeLoaded = true;
    $scope.geo_modal.show();
    $timeout(function() {
      $ionicScrollDelegate.$getByHandle('geo-scroll').resize();
      $ionicScrollDelegate.$getByHandle('geo-scroll').scrollTop();
    }, 350);
  };
  $scope.loadMoreModalData = function(modalGeoloc){
    $rootScope.show('Loading...');
    $scope.modalPage += 1;
    $scope.moreModalDataCanBeLoaded = false;
    console.log("GeoFeedCtrl :: loadMoreModalData... page:" + $scope.modalPage);
    postService.getModalFeed(modalGeoloc, $scope.modalPage)
    .then(function(posts){
      console.log("GeoFeedCtrl getModalFeed Length " + posts.length);
      postService.modalPictures = postService.modalPictures.concat(posts);
      $scope.modalPictures = postService.modalPictures;
      $scope.$broadcast('scroll.infiniteScrollComplete');
      $ionicScrollDelegate.$getByHandle('geo-scroll').resize();
      $rootScope.hide();
      $timeout(function() {
        if (posts.length == 10) {
          $scope.moreModalDataCanBeLoaded = true;
        }
      }, 5000);
    }, function(error) {
      $rootScope.hide();
      console.error("GeoFeedCtrl: getModalFeed ERROR: " + JSON.stringify(error));
    });
  };
  $scope.hideGeoModal = function() {
    $scope.geo_modal.hide();
    postService.modalPictures = [];
    $scope.modalPictures = [];
    $scope.modalGeoloc = null;
  };
  $scope.Geolocalise = function(geolocation){
    console.log("GeoFeedCtrl ::: Geolocalise Picture ID: " + JSON.stringify(geolocation.id) );
    mapService.selectedGeoloc = geolocation;
    mapService.removeAllGeoMarkers();
    $scope.hideGeoModal();
    $state.go('app.map');
  };
  $scope.Instagram = function(post){
    console.log("GeoFeedCtrl ::: Share geolocation: " + JSON.stringify(post.picture.get('file')._url) );
    $rootScope.show('Please wait, the Instagram plugin is loading...');
    $timeout(function() {
      $rootScope.hide();
      window.plugins.socialsharing.shareViaInstagram(post.geolocation.get("title"), post.picture.get('file')._url, function() {console.log('share ok');}, function(errormsg){alert(errormsg);});
    }, 2000);
  };
  $scope.Share = function(post){
    console.log("GeoFeedCtrl ::: Share geolocation: " + JSON.stringify(post.picture.get('file')._url) );
    $rootScope.show('Please wait, the sharing plugin is loading...');
    $timeout(function() {
      $rootScope.hide();
      window.plugins.socialsharing.share(post.description, post.geolocation.get("title"), post.picture.get('file')._url, post.picture.get('file')._url, function() {console.log('share ok');}, function(errormsg){alert(errormsg);});
    }, 2000);
  };
  $scope.Upload = function(geolocation){
    console.log("GeoFeedCtrl ::: Upload geolocation ID: " + geolocation.id );
    mapService.selectedGeoloc = geolocation;
    $scope.hideGeoModal();
    $state.go('app.upload');
  };
  $scope.unFollow = function(geolocation){
    console.log("GeoFeedCtrl ::: unFollow geolocation ID: " + geolocation.id );
    $scope.processing = true;
    $scope.following = false;
    parsePlugin.unsubscribe("t_"+geolocation.id, function(msg) {
      console.log("GeoFeedCtrl ::: parsePlugin.unsubscribe ::: " + geolocation.get("title") + " " + msg);
    }, function(error) {
      console.error('GeoFeedCtrl ::: parsePlugin.unsubscribe ::: error: ' + JSON.stringify(error));
    });
    postService.unFollow(geolocation);
    $timeout(function() {
      $scope.processing = false;
    }, 1000);
  };
  $scope.Follow = function(geolocation){
    console.log("GeoFeedCtrl ::: Follow geolocation ID: " + geolocation.id );
    if (userService.userLoggedIn) {
      $scope.processing = true;
      $scope.following = true;
      // Subscribe to receive notifications for this geolocation when new picture
      parsePlugin.subscribe("t_"+geolocation.id, function() {
        console.log("GeoFeedCtrl ::: parsePlugin.subscribe: " + geolocation.get("title"));
      }, function(error) {
        console.error('GeoFeedCtrl ::: parsePlugin.subscribe ::: error: ' + JSON.stringify(error));
      });
      // Send a push notification to the owner for the geolocation:
      Parse.Push.send({
        channels: [ "o_"+geolocation.id ],
        data: {
          alert: "New follower for " + geolocation.get("title"),
          goto: "app.userpictures",
          badge: "Increment",
          sound: "cheering.caf"
        }
      },
      {
        success: function() {
          console.log("Push was successful");
        },
        error: function(error) {
          console.log("Push error: " + JSON.stringify(error) );
        }
      });
      postService.Follow(geolocation);
      $timeout(function() {
        $scope.processing = false;
      }, 1000);
    }
    else {
      $scope.hideGeoModal();
      $state.go('app.userpictures');
    }
  };
  $scope.Report = function(post){
    console.log("GeoFeedCtrl ::: REPORT Picture ID: " + post.picture.id);
    if (userService.userLoggedIn) {
      var confirmPopup = $ionicPopup.confirm({
        title: 'Report a picture',
        template: 'Are you sure you want to report this photo?'
      });
      confirmPopup.then(function(res) {
        if(res) {
          postService.Report(post.picture);
          post.reported = true;
        }
      });
    }
    else {
      $scope.hideGeoModal();
      $state.go('app.userpictures');
    }
  };
  $scope.Like = function(picture, geoTitle){
    console.log("GeoFeedCtrl ::: LIKE Picture of the geolocation: " + geoTitle);
    if ($scope.processing === false) {
      if (userService.userLoggedIn) {
        $scope.processing = true;
        postService.Like(picture);
        // Send a push notification to let the picture owner for the new like:
        Parse.Push.send({
          channels: [ "p_"+picture.id ],
          data: {
            alert: "New like for " + geoTitle,
            goto: "app.userpictures",
            badge: "Increment",
            sound: "cheering.caf"
          }
        }, {
          success: function() {
            console.log("Push was successful");
          },
          error: function(error) {
            console.log("Push error: " + JSON.stringify(error) );
          }
        });
        $timeout(function() {
          $scope.processing = false;
        }, 1000);
      }
      else {
        $scope.hideGeoModal();
        $state.go('app.userpictures');
      }
    }
  };
	$scope.unLike = function(picture){
		console.log("GeoFeedCtrl ::: UNLIKE Picture ID: " + picture.id);
    if ($scope.processing === false) {
      $scope.processing = true;
      postService.unLike(picture);
      $timeout(function() {
        $scope.processing = false;
      }, 1000);
    }
	};
  $scope.loadMoreData = function(page){
    $rootScope.show('Loading...');
    $scope.page = page;
    postService.newgeolocation = false;
    $scope.moreDataCanBeLoaded = false;
    postService.getGeoFeed($scope.page)
    .then(function(posts){
      console.log("GeoFeedCtrl :: loadMoreData... posts:" + posts.length);
      if (page == 1) {
        postService.geolocations = posts;
      }
      else {
        postService.geolocations = postService.geolocations.concat(posts);
      }
      $scope.noGeoPicture = (posts.length===0 && page===1);
      $scope.geolocations = postService.geolocations;
      $scope.$broadcast('scroll.infiniteScrollComplete');
      $scope.$broadcast('scroll.refreshComplete');
      $ionicScrollDelegate.$getByHandle('feed-scroll').resize();
      $rootScope.hide();
      $timeout(function() {
        if (posts.length == 10) {
          $scope.moreDataCanBeLoaded = true;
        }
      }, 5000);
    }, function(error) {
      $rootScope.hide();
      console.error("GeoFeedCtrl: getGeoFeed ERROR: " + JSON.stringify(error));
    });
  };
  //////////////////////////////////////////////////////////////////
  $scope.$on('$ionicView.beforeEnter', function () {
    console.log("--------------------------------------------------------");
    console.log("GeoFeedCtrl......... beforeEnter........ + " + postService.newgeolocation);
    if (postService.newgeolocation) {
      $ionicScrollDelegate.$getByHandle('feed-scroll').scrollTop();
      $scope.loadMoreData(1);
    }
  });
  /////////////////////////////////////////////////////////////////////////////
  console.log("--------------------------------------------------------------");
  console.log("GeoFeedCtrl........................ " + userService.userLoggedIn);
  $scope.loggedUser = userService.loggedUser;
  $scope.page = 0;
  $scope.noGeoPicture = false;
  $scope.processing = false;
  $scope.moreDataCanBeLoaded = true;
  $scope.geolocations = [];
  $scope.modalPictures = [];
})



.controller('GeolocaliseCtrl', function($scope, $rootScope, $state, $ionicModal, $ionicHistory, $ionicPlatform, $timeout, userService, postService, mapService) {
  $scope.Geolocalise = function() {
    if (mapService.selectedGeoloc) {
      console.log("GeolocaliseCtrl: Geolocalise :::: selectedGeoloc.Id -> " + mapService.selectedGeoloc.get('title'));
      $state.go('edit');
    }
    else if (mapService.longclickpos && mapService.longclickpos.lat) {
      console.log("GeolocaliseCtrl: mapService.longclickpos : " + JSON.stringify(mapService.longclickpos));
      $state.go('edit');
    }
    else {
      console.error("GeolocaliseCtrl: mapService.longclickpos : " + JSON.stringify(mapService.longclickpos));
      $scope.error = "Please select an existing geolocation or long click on the map to add a new geolocation.";
    }
  };
  $scope.Cancel = function() {
    console.log("GeolocaliseCtrl: Cancel");
    $ionicHistory.goBack();
  };
  //////////////////////////////////////////////////////////////////////
  $scope.$on('$ionicView.beforeEnter', function() {
    console.log("--------------------------------------");
    console.log("GeolocaliseCtrl :: $ionicView.beforeEnter : " + userService.userLoggedIn);
    $scope.userLoggedIn = userService.userLoggedIn;
  });
  $scope.$on('$ionicView.afterEnter', function() {
    $scope.error = "";
    if(typeof plugin !== 'undefined') {
      mapService.cameraReady = false;
      var div = document.getElementById("geo_canvas");
      map = plugin.google.maps.Map.getMap(div);
      map.setVisible(true);
      console.log("GeolocaliseCtrl afterENTERING THE MAP ::: setVisible=true");
      navigator.geolocation.getCurrentPosition(
        function (position) {
          console.log("GeolocaliseCtrl getCurrentPosition ::: " + JSON.stringify(position) );
          //map.setCenter({lat:position.coords.latitude, lng:position.coords.longitude});
          //map.setZoom(10);
          map.animateCamera({
            'target': {lat:position.coords.latitude, lng:position.coords.longitude},
            'zoom': 19,
            'tilt': 0,
            'duration': 10
          });
          mapService.cameraReady = true;
        },
        function (error) {
          console.error('GeolocaliseCtrl getCurrentPosition ::: ' + JSON.stringify(error));
        },
        { enableHighAccuracy: true }
      );
    }
    else {
      console.error("GeolocaliseCtrl afterENTERING THE MAP ::: Plugin Error");
    }
  });
  $scope.$on('$ionicView.beforeLeave', function() {
    console.log("GeolocaliseCtrl beforeLeave ----------> HIDDING THE MAP !!! ");
    map = plugin.google.maps.Map.getMap();
    map.setVisible(false);
  });
  //////////////////////////////////////////////////////////////////////
  console.log("--------------------------------------------------------------");
  console.log("GeolocaliseCtrl..... ");
  $scope.error = "";
})



.controller('EditCtrl', function($scope, $rootScope, $state, $ionicModal, $ionicHistory, $ionicPlatform, $stateParams, $timeout, userService, postService, mapService) {
  $scope.SavePicture = function(geolocation, picture){
    console.log("EditCtrl :::: SavePicture");
    $rootScope.show("Saving");
    if ($scope.geolocation.title) {
      picture.set("description", picture.description);
      picture.save(null, {
        success: function(picture) {
          postService.updatePicDescription(picture.id,picture.description);
          if (picture.id == picture.get("geolocation").get("picture").id) {
            geolocation.set("title", geolocation.title);
            geolocation.save(null, {
              success: function(geolocation) {
                postService.updateGeoTitle(geolocation.id, geolocation.title);
                $rootScope.hide();
                $ionicHistory.goBack();
              },
              error: function(geolocation, error) {
                $rootScope.hide();
                console.error(JSON.stringify(error));
              }
            });
          }
          else {
            $rootScope.hide();
            $ionicHistory.goBack();
          }
        },
        error: function(picture, error) {
          $rootScope.hide();
          console.error(JSON.stringify(error));
        }
      });
    }
    else {
      $rootScope.hide();
      console.error("EditCtrl ::: NO TITLE!!!!");
      $scope.error = "Please enter a geolocation title.";
    }
  };
  $scope.Upload = function() {
    if (mapService.selectedGeoloc) {
      console.log("EditCtrl ::: Adding a new picture of an existing geolocation: " + mapService.selectedGeoloc.get("title") );
      $rootScope.show("Uploading...");
      var PicObj = Parse.Object.extend("Pictures");
      var picture = new PicObj();
      picture.set("approved", true);
      picture.set("likes", 0);
      picture.set("reports", 0);
      picture.set("description", $scope.picture.description);
      picture.set("file", postService.tempPicture.parseFile);
      picture.set("geolocation", mapService.selectedGeoloc);
      picture.set("user", Parse.User.current());
      picture.save(null, {
        success: function(picture) {
          $rootScope.hide();
          postService.incrementGeoPicCount(mapService.selectedGeoloc, 1);
          // Subscribe to receive notifications for this picture when new like
          parsePlugin.subscribe("p_"+picture.id, function() {
            console.log("EditCtrl ::: Upload : parsePlugin.subscribe ::: " + picture.id );
          }, function(error) {
            console.error('EditCtrl ::: Upload : parsePlugin.subscribe ::: error: ' + JSON.stringify(error));
          });
          // Send a push notification to let the geolocation owner know the upload of a new picture:
          Parse.Push.send({
            channels: [ "t_"+mapService.selectedGeoloc.id ],
            data: {
              alert: "New picture for " + mapService.selectedGeoloc.get("title"),
              goto: "app.following",
              badge: "Increment",
              sound: "cheering.caf"
            }
          }, {
            success: function() {
              console.log("Push was successful");
            },
            error: function(error) {
              console.log("Push error: " + JSON.stringify(error) );
            }
          });
          $ionicHistory.clearCache()
          .then(function(){
            mapService.selectedGeoloc = null;
            $state.go('app.userpictures');
          });
        },
        error: function(object, error) {
          $rootScope.hide();
          console.error("ERROR UPLOADING <<<<<<<<<<----------- : " + JSON.stringify(error));
        }
      });
    }
    else if (mapService.longclickpos && mapService.longclickpos.lat) {
      console.log("EditCtrl ::: Upload : mapService.longclickpos : " + JSON.stringify(mapService.longclickpos));
      console.log('..----------.. Uploading a NEW geolocation ..----------..');
      $rootScope.show('Saving...');
      console.log("EditCtrl ::: Upload : STARTING UPLOADING ----------->>>>>>>");
      var GeoObj = Parse.Object.extend("Geolocations");
      var geolocation = new GeoObj();
      var point = new Parse.GeoPoint({latitude:mapService.longclickpos.lat, longitude:mapService.longclickpos.lng});
      geolocation.set("approved", true);
      geolocation.set("followers", 0);
      geolocation.set("title", $scope.geolocation.title);
      geolocation.set("geolocation", point);
      geolocation.set("user", Parse.User.current());
      geolocation.save(null, {
        success: function(geolocation) {
          //console.log("EditCtrl ::: Upload : STOP UPLOADING <<<<<<<<<<-----------: " + JSON.stringify(geolocation));
          var PicObj = Parse.Object.extend("Pictures");
          var picture = new PicObj();
          picture.set("approved", true);
          picture.set("likes", 0);
          picture.set("reports", 0);
          picture.set("description", $scope.picture.description);
          picture.set("file", postService.tempPicture.parseFile );
          picture.set("geolocation", geolocation);
          picture.set("user", Parse.User.current());
          picture.save(null, {
            success: function(picture) {
              // Subscribe to receive notifications for this picture when new like
              parsePlugin.subscribe("p_"+picture.id, function() {
                console.log("EditCtrl ::: Upload : parsePlugin.subscribe ::: " + picture.id );
              }, function(error) {
                console.error('EditCtrl ::: Upload : parsePlugin.subscribe ::: error: ' + JSON.stringify(error));
              });
              geolocation.set("picture", picture);
              geolocation.set("picCount", 1);
              geolocation.save(null, {
                success: function(geolocation) {
                  postService.Follow(geolocation);
                  // Subscribe to receive notifications for this geolocation when new picture
                  parsePlugin.subscribe("t_"+geolocation.id, function() {
                    console.log("EditCtrl ::: Upload : parsePlugin.subscribe: " + geolocation.id);
                  }, function(error) {
                    console.error('EditCtrl ::: Upload : parsePlugin.subscribe ::: error: ' + JSON.stringify(error));
                  });
                  // Subscribe to receive notifications for this geolocation when new follower
                  parsePlugin.subscribe("o_"+geolocation.id, function() {
                    console.log("EditCtrl ::: Upload : parsePlugin.subscribe: " + geolocation.id);
                  }, function(error) {
                    console.error('EditCtrl ::: Upload : parsePlugin.subscribe ::: error: ' + JSON.stringify(error));
                  });
                  $rootScope.hide();
                  mapService.removeAllGeoMarkers();
                  $ionicHistory.clearCache()
                  .then(function(){
                    $state.go('app.userpictures');
                  });
                },
                error: function(error) {
                  $rootScope.hide();
                  console.error("ERROR UPLOADING <<<<<<<<<<----------- " + error);
                }
              });
            },
            error: function(error) {
              $rootScope.hide();
              console.error("ERROR UPLOADING <<<<<<<<<<----------- " + error);
            }
          });
        },
        error: function(error) {
          $rootScope.hide();
          console.error("ERROR UPLOADING <<<<<<<<<<----------- " + error);
        }
      });
    }
    /*
    else {
      console.error("EditCtrl ::: upload : mapService.longclickpos : " + JSON.stringify(mapService.longclickpos));
      $scope.error = "Please select an existing geolocation or long click on the map to save a new geolocation.";
    }
    */
  };
  $scope.Cancel = function() {
    console.log("EditCtrl: Cancel");
    $ionicHistory.goBack();
    //$state.go('app.userpictures');
  };
  ///////////////////////////////////////////////////////////////
  console.log("--------------------------------------------------------------");
  console.log("EditCtrl...");
  $scope.geolocation = {};
  $scope.picture = {};
  if ($stateParams.picId) {
    console.log("EditCtrl :::: Editing an existing picture!!!");
    $rootScope.show("Loading...");
    postService.getPicture($stateParams.picId)
    .then(function(picture){
      $scope.picture = picture;
      $scope.geolocation = picture.get("geolocation");
      $scope.picture.description = picture.get("description");
      $scope.geolocation.title = picture.get("geolocation").get("title");
      console.log("EditCtrl postService.getPicture ::::: " + JSON.stringify($scope.geolocation.title) );
      $rootScope.hide();
    }, function(error) {
      $rootScope.hide();
      console.error("EditCtrl: getPicture ERROR: " + JSON.stringify(error));
    });
  }
  else if (mapService.selectedGeoloc) {
    console.log("EditCtrl :::: adding new picture to an existing geolocation!!!");
    $scope.geolocation = mapService.selectedGeoloc;
  }
})



.controller('UploadCtrl', function($scope, $rootScope, $state, $ionicModal, $ionicHistory, $ionicPlatform, $cordovaCamera, $timeout, userService, postService, mapService) {
  $scope.Cancel = function() {
    console.log("UploadCtrl: Cancel");
    $ionicHistory.goBack();
  };
  $scope.Upload = function(geolocation){
    console.log('UploadCtrl ::: Uploading a Picture -----> ' + $scope.picdata.length);
    var parseFile = new Parse.File("picture.png", {
      base64: $scope.picdata
    });
    parseFile.save();
    postService.tempPicture.parseFile = parseFile;
    if (mapService.longclickpos && mapService.longclickpos.lat) {
      $state.go('edit');
    }
    else {
      $state.go('geolocalise');
    }
  };
  $scope.SelectPicture = function(){
    console.log("UploadCtrl SelectPicture SelectPicture SelectPicture");
    var options = {
      quality : 100,
      allowEdit : true,
      destinationType : Camera.DestinationType.DATA_URL,
      sourceType : Camera.PictureSourceType.PHOTOLIBRARY,
      encodingType: Camera.EncodingType.JPG,
      saveToPhotoAlbum: true
      //popoverOptions: CameraPopoverOptions,
      //targetWidth: 1500,
      //targetHeight: 1500
    };
    $cordovaCamera.getPicture(options)
    .then(function(picData) {
      console.log("UploadCtrl ::: getPicture result length: " + JSON.stringify(picData.length));
      $scope.picdata = picData;
    }, function(error) {
      console.error("UploadCtrl ::: getPicture ERROR: " + error);
      //$ionicHistory.goBack();
    });
  };
  $scope.TakePicture = function(){
    console.log("UploadCtrl SelectPicture SelectPicture SelectPicture");
    var options = {
      quality : 100,
      allowEdit : true,
      destinationType : Camera.DestinationType.DATA_URL,
      sourceType : Camera.PictureSourceType.CAMERA,
      encodingType: Camera.EncodingType.JPG,
      saveToPhotoAlbum: true
    };
    $cordovaCamera.getPicture(options)
    .then(function(picData) {
      console.log("UploadCtrl ::: getPicture result length: " + JSON.stringify(picData.length));
      $scope.picdata = picData;
    }, function(error) {
      console.error("UploadCtrl ::: getPicture ERROR: " + error);
      //$ionicHistory.goBack();
    });
  };
  ///////////////////////////////////////////////////////////////
  console.log("--------------------------------------------------------------");
  console.log("UploadCtrl... " + userService.userLoggedIn);
  $scope.userLoggedIn = userService.userLoggedIn;
  if (userService.userLoggedIn) {
    $scope.TakePicture();
  }
})


.controller('FollowingCtrl', function($scope, $rootScope, $cordovaSocialSharing, $ionicModal, $ionicPopup, $timeout, $ionicHistory, $state, $ionicScrollDelegate, $stateParams, postService, mapService, userService) {
  $ionicModal.fromTemplateUrl('views/app/geomodal.html', {
    scope: $scope,
    animation: 'slide-in-up'
  }).then(function(modal) {
    $scope.geo_modal = modal;
  });
  $scope.$on('$destroy', function() {
    $scope.geo_modal.remove();
  });
  $scope.showGeoModal = function(post, GeolocOwner) {
    console.log("FollowingCtrl opening geolocation modal:  " + post.geolocation.get("title") + " by " + GeolocOwner);
    $scope.modalGeoloc = post.geolocation;
    postService.isGeoFollowedbyUser(post.geolocation)
    .then(function(result) {
      $scope.following = result;
    });
    $scope.modalPage = 0;
    $scope.GeolocOwner = GeolocOwner;
    $scope.moreModalDataCanBeLoaded = true;
    $scope.geo_modal.show();
    $timeout(function() {
      $ionicScrollDelegate.$getByHandle('geo-scroll').resize();
      $ionicScrollDelegate.$getByHandle('geo-scroll').scrollTop();
    }, 350);
  };
  $scope.loadMoreModalData = function(modalGeoloc){
    $rootScope.show('Loading...');
    $scope.modalPage += 1;
    $scope.moreModalDataCanBeLoaded = false;
    console.log("FollowingCtrl :: loadMoreModalData... page:" + $scope.modalPage);
    postService.getModalFeed(modalGeoloc, $scope.modalPage)
    .then(function(pictures){
      console.log("FollowingCtrl getModalFeed Length " + pictures.length);
      postService.modalPictures = postService.modalPictures.concat(pictures);
      $scope.modalPictures = postService.modalPictures;
      $scope.$broadcast('scroll.infiniteScrollComplete');
      $ionicScrollDelegate.$getByHandle('geo-scroll').resize();
      $rootScope.hide();
      $timeout(function() {
        if (pictures.length == 10) {
          $scope.moreModalDataCanBeLoaded = true;
        }
      }, 5000);
    }, function(error) {
      $rootScope.hide();
      console.error("FollowingCtrl: getModalFeed ERROR: " + JSON.stringify(error));
    });
  };
  $scope.hideGeoModal = function() {
    $scope.geo_modal.hide();
    postService.modalPictures = [];
    $scope.modalPictures = [];
    $scope.modalGeoloc = null;
  };
  $scope.Geolocalise = function(geolocation){
    console.log("FollowingCtrl ::: Geolocalise Picture ID: " + JSON.stringify(geolocation) );
    mapService.selectedGeoloc = geolocation;
    mapService.removeAllGeoMarkers();
    $scope.hideGeoModal();
    $state.go('app.map');
  };
  $scope.Instagram = function(post){
    console.log("FollowingCtrl ::: Share geolocation: " + JSON.stringify(post.picture.get('file')._url) );
    $rootScope.show('Please wait, the Instagram plugin is loading...');
    $timeout(function() {
      $rootScope.hide();
      window.plugins.socialsharing.shareViaInstagram(post.geolocation.get("title"), post.picture.get('file')._url, function() {console.log('share ok');}, function(errormsg){alert(errormsg);});
    }, 2000);
  };
  $scope.Share = function(post){
    console.log("FollowingCtrl ::: Share geolocation: " + JSON.stringify(post.picture.get('file')._url) );
    $rootScope.show('Please wait, the sharing plugin is loading...');
    $timeout(function() {
      $rootScope.hide();
      window.plugins.socialsharing.share(post.description, post.geolocation.get("title"), post.picture.get('file')._url, post.picture.get('file')._url, function() {console.log('share ok');}, function(errormsg){alert(errormsg);});
    }, 2000);
  };
  $scope.Upload = function(geolocation){
    console.log("FollowingCtrl ::: Upload geolocation ID: " + geolocation.id );
    $scope.hideGeoModal();
    mapService.selectedGeoloc = geolocation;
    $state.go('app.upload');
    //$state.go('app.upload', {geolocationId:geolocation.id}, {reload:true});
  };
  $scope.unFollow = function(geolocation){
    console.log("FollowingCtrl ::: unFollow geolocation ID: " + geolocation.id );
    $scope.processing = true;
    $scope.following = false;
    parsePlugin.unsubscribe("t_"+geolocation.id, function(msg) {
      console.log("FollowingCtrl ::: parsePlugin.unsubscribe ::: " + geolocation.get("title") + " " + msg);
    }, function(error) {
      console.error('FollowingCtrl ::: parsePlugin.unsubscribe ::: error: ' + JSON.stringify(error));
    });
    postService.unFollow(geolocation);
    $timeout(function() {
      $scope.processing = false;
    }, 1000);
  };
  $scope.Follow = function(geolocation){
    console.log("FollowingCtrl ::: Follow geolocation ID: " + geolocation.id );
    $scope.processing = true;
    $scope.following = true;
    // Subscribe to receive notifications for this geolocation when new picture
    parsePlugin.subscribe("t_"+geolocation.id, function() {
      console.log("FollowingCtrl ::: parsePlugin.subscribe: " + geolocation.get("title"));
    }, function(error) {
      console.error('FollowingCtrl ::: parsePlugin.subscribe ::: error: ' + JSON.stringify(error));
    });
    // Send a push notification to the owner for the geolocation:
    Parse.Push.send({
      channels: [ "o_"+geolocation.id ],
      data: {
        alert: "New follower for " + geolocation.get("title"),
        goto: "app.userpictures",
        badge: "Increment",
        sound: "cheering.caf"
      }
    },
    {
      success: function() {
        console.log("Push was successful");
      },
      error: function(error) {
        console.log("Push error: " + JSON.stringify(error) );
      }
    });
    postService.Follow(geolocation);
    $timeout(function() {
      $scope.processing = false;
    }, 1000);
  };
  $scope.Report = function(post){
    console.log("FollowingCtrl ::: REPORT Picture ID: " + post.picture.id);
    var confirmPopup = $ionicPopup.confirm({
      title: 'Report a picture',
      template: 'Are you sure you want to report this picture?'
    });
    confirmPopup.then(function(res) {
      if(res) {
        postService.Report(post.picture);
        post.reported = true;
      }
    });
  };
  $scope.Like = function(picture, geoTitle){
		console.log("FollowingCtrl ::: LIKE Picture of the geolocation: " + geoTitle);
    if ($scope.processing === false) {
      $scope.processing = true;
      postService.Like(picture);
      // Send a push notification to let the picture owner for the new like:
      Parse.Push.send({
        channels: [ "p_"+picture.id ],
        data: {
          alert: "New like for " + geoTitle,
          goto: "app.userpictures",
          badge: "Increment",
          sound: "cheering.caf"
        }
      }, {
        success: function() {
          console.log("Push was successful");
        },
        error: function(error) {
          console.log("Push error: " + JSON.stringify(error) );
        }
      });
      $timeout(function() {
        $scope.processing = false;
      }, 1000);
    }
	};
	$scope.unLike = function(picture){
		console.log("FollowingCtrl ::: UNLIKE Picture ID: " + picture.id);
    if ($scope.processing === false) {
      $scope.processing = true;
      postService.unLike(picture);
      $timeout(function() {
        $scope.processing = false;
      }, 1000);
    }
	};
  $scope.loadMoreData = function(page){
    $rootScope.show('Loading...');
    $scope.page = page;
    $scope.moreDataCanBeLoaded = false;
    console.log("-----------------------------------------------");
    console.log("FollowingCtrl :: loadMoreData... page:" + $scope.page);
    postService.getFollowPictures($scope.page)
    .then(function(posts){
      if (page == 1) {
        postService.followPictures = posts;
      }
      else {
        postService.followPictures = postService.followPictures.concat(posts);
      }
      $scope.noFollowPicture = (posts.length===0 && page===1);
      $scope.followPictures = postService.followPictures;
      $scope.$broadcast('scroll.infiniteScrollComplete');
      $scope.$broadcast('scroll.refreshComplete');
      $ionicScrollDelegate.$getByHandle('feed-scroll').resize();
      $rootScope.hide();
      $timeout(function() {
        if (posts.length == 10) {
          $scope.moreDataCanBeLoaded = true;
        }
      }, 5000);
    }, function(error) {
      $rootScope.hide();
      console.error("FollowingCtrl: getFollowPictures ERROR: " + JSON.stringify(error));
    });
  };
  /////////////////////////////////////////////////////////////////////////////
  console.log("--------------------------------------------------------------");
  console.log("FollowingCtrl........................ " + userService.userLoggedIn);
  $scope.page = 0;
  $scope.userLoggedIn = userService.userLoggedIn;
  $scope.loggedUser = userService.loggedUser;
  $scope.moreDataCanBeLoaded = true;
  $scope.noFollowPicture = false;
  $scope.processing = false;
  $scope.followPictures = [];
  $scope.modalPictures = [];
})



.controller('UserPicCtrl', function($scope, $rootScope, $cordovaSocialSharing, $ionicModal, $ionicPopup, $timeout, $ionicHistory, $state, $ionicScrollDelegate, $stateParams, postService, mapService, userService) {
  $ionicModal.fromTemplateUrl('views/app/geomodal.html', {
    scope: $scope,
    animation: 'slide-in-up'
  }).then(function(modal) {
    $scope.geo_modal = modal;
  });
  $scope.$on('$destroy', function() {
    $scope.geo_modal.remove();
  });
  $scope.showGeoModal = function(post, GeolocOwner) {
    console.log("UserPicCtrl opening geolocation modal: " + post.geolocation.get("title") + " by " + GeolocOwner);
    $scope.modalGeoloc = post.geolocation;
    postService.isGeoFollowedbyUser(post.geolocation)
    .then(function(result) {
      $scope.following = result;
    });
    $scope.modalPage = 0;
    $scope.GeolocOwner = GeolocOwner;
    $scope.myModal = true;
    $scope.moreModalDataCanBeLoaded = true;
    $scope.geo_modal.show();
    $timeout(function() {
      $ionicScrollDelegate.$getByHandle('geo-scroll').resize();
      $ionicScrollDelegate.$getByHandle('geo-scroll').scrollTop();
    }, 350);
  };
  $scope.loadMoreModalData = function(modalGeoloc){
    $rootScope.show('Loading...');
    $scope.modalPage += 1;
    $scope.moreModalDataCanBeLoaded = false;
    console.log("UserPicCtrl :: loadMoreModalData... page:" + $scope.modalPage);
    postService.getModalFeed(modalGeoloc, $scope.modalPage)
    .then(function(pictures){
      console.log("UserPicCtrl getModalFeed Length " + pictures.length);
      postService.modalPictures = postService.modalPictures.concat(pictures);
      $scope.modalPictures = postService.modalPictures;
      $scope.$broadcast('scroll.infiniteScrollComplete');
      $ionicScrollDelegate.$getByHandle('geo-scroll').resize();
      $rootScope.hide();
      $timeout(function() {
        if (pictures.length == 10) {
          $scope.moreModalDataCanBeLoaded = true;
        }
      }, 5000);
    }, function(error) {
      $rootScope.hide();
      console.error("UserPicCtrl: getModalFeed ERROR: " + JSON.stringify(error));
    });
  };
  $scope.hideGeoModal = function() {
    $scope.geo_modal.hide();
    $scope.myModal = false;
    postService.modalPictures = [];
    $scope.modalPictures = [];
    $scope.modalGeoloc = null;
  };
  $scope.Geolocalise = function(geolocation){
    console.log("UserPicCtrl ::: Geolocalise Picture ID: " + JSON.stringify(geolocation) );
    mapService.selectedGeoloc = geolocation;
    mapService.removeAllGeoMarkers();
    $state.go('app.map');
    $scope.hideGeoModal();
  };
  $scope.Instagram = function(post){
    console.log("UserPicCtrl ::: Share geolocation: " + JSON.stringify(post.picture.get('file')._url) );
    $rootScope.show('Please wait, the Instagram plugin is loading...');
    $timeout(function() {
      $rootScope.hide();
      window.plugins.socialsharing.shareViaInstagram(post.geolocation.get("title"), post.picture.get('file')._url, function() {console.log('share ok');}, function(errormsg){alert(errormsg);});
    }, 2000);
  };
  $scope.Share = function(post){
    console.log("UserPicCtrl ::: Share geolocation: " + JSON.stringify(post.picture.get('file')._url) );
    $rootScope.show('Please wait, the sharing plugin is loading...');
    $timeout(function() {
      $rootScope.hide();
      window.plugins.socialsharing.share(post.description, post.geolocation.get("title"), post.picture.get('file')._url, post.picture.get('file')._url, function() {console.log('share ok');}, function(errormsg){alert(errormsg);});
    }, 2000);
  };
  $scope.Upload = function(geolocation){
    console.log("UserPicCtrl ::: Upload geolocation ID: " + geolocation.id );
    mapService.selectedGeoloc = geolocation;
    $scope.hideGeoModal();
    $state.go('app.upload');
    //$state.go('app.upload', {geolocationId:geolocation.id}, {reload:true});
  };
  $scope.unFollow = function(geolocation){
    console.log("UserPicCtrl ::: unFollow geolocation ID: " + geolocation.id );
    $scope.processing = true;
    $scope.following = false;
    parsePlugin.unsubscribe("t_"+geolocation.id, function(msg) {
      console.log("UserPicCtrl ::: parsePlugin.unsubscribe ::: " + geolocation.get("title") + " " + msg);
    }, function(error) {
      console.error('UserPicCtrl ::: parsePlugin.unsubscribe ::: error: ' + JSON.stringify(error));
    });
    postService.unFollow(geolocation);
    $timeout(function() {
      $scope.processing = false;
    }, 1000);
  };
  $scope.Follow = function(geolocation){
    console.log("UserPicCtrl ::: Follow geolocation ID: " + geolocation.id );
    $scope.processing = true;
    $scope.following = true;
    // Subscribe to receive notifications for this geolocation when new picture
    parsePlugin.subscribe("t_"+geolocation.id, function() {
      console.log("UserPicCtrl ::: parsePlugin.subscribe: " + geolocation.get("title"));
    }, function(error) {
      console.error('UserPicCtrl ::: parsePlugin.subscribe ::: error: ' + JSON.stringify(error));
    });
    // Send a push notification to the owner for the geolocation:
    Parse.Push.send({
      channels: [ "o_"+geolocation.id ],
      data: {
        alert: "New follower for " + geolocation.get("title"),
        goto: "app.userpictures",
        badge: "Increment",
        sound: "cheering.caf"
      }
    },
    {
      success: function() {
        console.log("Push was successful");
      },
      error: function(error) {
        console.log("Push error: " + JSON.stringify(error) );
      }
    });
    postService.Follow(geolocation);
    $timeout(function() {
      $scope.processing = false;
    }, 1000);
  };
  $scope.Edit = function(picture){
    console.log("UserPicCtrl ::: Edit Picture ID: " + picture.id);
    $state.go('edit', {picId:picture.id});
    $scope.hideGeoModal();
  };
  $scope.Report = function(post){
    console.log("UserPicCtrl ::: REPORT Picture ID: " + post.picture.id);
    var confirmPopup = $ionicPopup.confirm({
      title: 'Report a picture',
      template: 'Are you sure you want to report this picture?'
    });
    confirmPopup.then(function(res) {
      if(res) {
        postService.Report(post.picture);
        post.reported = true;
      }
    });
  };
  $scope.Like = function(picture, geoTitle){
		console.log("UserPicCtrl ::: LIKE Picture of the geolocation: " + geoTitle);
    if ($scope.processing === false) {
      $scope.processing = true;
      postService.Like(picture);
      // Send a push notification to let the picture owner for the new like:
      Parse.Push.send({
        channels: [ "p_"+picture.id ],
        data: {
          alert: "New like for " + geoTitle,
          goto: "app.userpictures",
          badge: "Increment",
          sound: "cheering.caf"
        }
      }, {
        success: function() {
          console.log("Push was successful");
        },
        error: function(error) {
          console.log("Push error: " + JSON.stringify(error) );
        }
      });
      $timeout(function() {
        $scope.processing = false;
      }, 1000);
    }
	};
	$scope.unLike = function(picture){
		console.log("UserPicCtrl ::: UNLIKE Picture ID: " + picture.id);
    if ($scope.processing === false) {
      $scope.processing = true;
      postService.unLike(picture);
      $timeout(function() {
        $scope.processing = false;
      }, 1000);
    }
	};
  $scope.deletePost = function(post){
    console.log("UserPicCtrl ::: DELETE Picture ID: " + post.picture.id);
    var confirmPopup = $ionicPopup.confirm({
      title: 'Delete a picture',
      template: 'Are you sure you want to delete this picture?'
    });
    confirmPopup.then(function(res) {
      if(res) {
        mapService.selectedGeoloc = null;
        $scope.hideGeoModal();
        postService.deletePicture(post);
        $scope.userPictures = postService.userPictures;
        $timeout(function() {
          $ionicScrollDelegate.$getByHandle('feed-scroll').resize();
        }, 300);
      }
    });
  };
  $scope.loadMoreData = function(page){
    $rootScope.show('Loading...');
    $scope.page = page;
    $scope.moreDataCanBeLoaded = false;
    console.log("-----------------------------------------------");
    console.log("UserPicCtrl :: loadMoreData... page:" + $scope.page);
    postService.getUserPictures($scope.page)
    .then(function(posts){
      if (page == 1) {
        postService.userPictures = posts;
      }
      else {
        postService.userPictures = postService.userPictures.concat(posts);
      }
      $scope.noUserPicture = (posts.length===0 && page===1);
      $scope.userPictures = postService.userPictures;
      $scope.$broadcast('scroll.infiniteScrollComplete');
      $scope.$broadcast('scroll.refreshComplete');
      $ionicScrollDelegate.$getByHandle('feed-scroll').resize();
      $rootScope.hide();
      $timeout(function() {
        if (posts.length == 10) {
          $scope.moreDataCanBeLoaded = true;
        }
      }, 5000);
    }, function(error) {
      $rootScope.hide();
      console.error("UserPicCtrl: getUserPictures ERROR: " + JSON.stringify(error));
    });
  };
  /////////////////////////////////////////////////////////////////////////////
  console.log("--------------------------------------------------------------");
  console.log("UserPicCtrl........................ " + userService.userLoggedIn);
  $scope.page = 0;
  $scope.userLoggedIn = userService.userLoggedIn;
  $scope.loggedUser = userService.loggedUser;
  $scope.myPictures = true;
  $scope.processing = false;
  $scope.moreDataCanBeLoaded = true;
  $scope.userPictures = [];
  $scope.modalPictures = [];
})



.controller('MapCtrl', function($scope, $rootScope, $cordovaSocialSharing, $ionicPopup, $timeout, $stateParams, $ionicHistory, $ionicModal, $ionicScrollDelegate, $state, userService, mapService, postService) {
  $ionicModal.fromTemplateUrl('views/app/geomodal.html', {
    scope: $scope,
    animation: 'slide-in-up'
  }).then(function(modal) {
    $scope.geo_modal = modal;
  });
  $scope.$on('$destroy', function() {
    $scope.geo_modal.remove();
  });
  $scope.showGeoModal = function(geolocation, GeolocOwner) {
    console.log("MapCtrl opening geolocation modal: " + geolocation.get("title") + " by " + GeolocOwner);
    $scope.modalGeoloc = geolocation;
    postService.isGeoFollowedbyUser(geolocation)
    .then(function(result) {
      $scope.following = result;
    });
    $scope.modalPage = 0;
    $scope.GeolocOwner = GeolocOwner;
    $scope.moreModalDataCanBeLoaded = true;
    $scope.geo_modal.show();
    map = plugin.google.maps.Map.getMap();
    map.setVisible(false);
    $timeout(function() {
      $ionicScrollDelegate.$getByHandle('geo-scroll').resize();
      $ionicScrollDelegate.$getByHandle('geo-scroll').scrollTop();
    }, 350);
  };
  $scope.loadMoreModalData = function(modalGeoloc){
    $rootScope.show('Loading...');
    $scope.modalPage += 1;
    $scope.moreModalDataCanBeLoaded = false;
    console.log("MapCtrl :: loadMoreModalData... page:" + $scope.modalPage);
    postService.getModalFeed(modalGeoloc, $scope.modalPage)
    .then(function(pictures){
      console.log("MapCtrl getModalFeed Length " + pictures.length);
      postService.modalPictures = postService.modalPictures.concat(pictures);
      $scope.modalPictures = postService.modalPictures;
      $scope.$broadcast('scroll.infiniteScrollComplete');
      $ionicScrollDelegate.$getByHandle('geo-scroll').resize();
      $rootScope.hide();
      $timeout(function() {
        if (pictures.length == 10) {
          $scope.moreModalDataCanBeLoaded = true;
        }
      }, 5000);
    }, function(error) {
      $rootScope.hide();
      console.error("MapCtrl: getModalFeed ERROR: " + JSON.stringify(error));
    });
  };
  $scope.hideGeoModal = function() {
    $scope.geo_modal.hide();
    map = plugin.google.maps.Map.getMap();
    map.setVisible(true);
    postService.modalPictures = [];
    $scope.modalPictures = [];
    $scope.modalGeoloc = null;
  };
  $scope.unFollow = function(geolocation){
    console.log("MapCtrl ::: unFollow geolocation ID: " + geolocation.id );
    $scope.processing = true;
    $scope.following = false;
    parsePlugin.unsubscribe("t_"+geolocation.id, function(msg) {
      console.log("MapCtrl ::: parsePlugin.unsubscribe ::: " + geolocation.get("title") + " " + msg);
    }, function(error) {
      console.error('MapCtrl ::: parsePlugin.unsubscribe ::: error: ' + JSON.stringify(error));
    });
    postService.unFollow(geolocation);
    $timeout(function() {
      $scope.processing = false;
    }, 1000);
  };
  $scope.Follow = function(geolocation){
    console.log("MapCtrl ::: Follow geolocation ID: " + geolocation.id );
    if (userService.userLoggedIn) {
      $scope.processing = true;
      $scope.following = true;
      // Subscribe to receive notifications for this geolocation when new picture
      parsePlugin.subscribe("t_"+geolocation.id, function() {
        console.log("MapCtrl ::: parsePlugin.subscribe: " + geolocation.get("title"));
      }, function(error) {
        console.error('MapCtrl ::: parsePlugin.subscribe ::: error: ' + JSON.stringify(error));
      });
      // Send a push notification to the owner for the geolocation:
      Parse.Push.send({
        channels: [ "o_"+geolocation.id ],
        data: {
          alert: "New follower for " + geolocation.get("title"),
          goto: "app.userpictures",
          badge: "Increment",
          sound: "cheering.caf"
        }
      },
      {
        success: function() {
          console.log("Push was successful");
        },
        error: function(error) {
          console.log("Push error: " + JSON.stringify(error) );
        }
      });
      postService.Follow(geolocation);
      $timeout(function() {
        $scope.processing = false;
      }, 1000);
    }
    else {
      $scope.hideGeoModal();
      $state.go('app.userpictures');
    }
  };
  $scope.Geolocalise = function(geolocation){
    console.log("MapCtrl ::: Geolocalise geolocation ID: " + JSON.stringify(geolocation) );
    mapService.removeAllGeoMarkers();
    mapService.selectedGeoloc = geolocation;
    $state.go('app.map');
    $scope.hideGeoModal();
  };
  $scope.Instagram = function(post){
    console.log("MapCtrl ::: Share geolocation: " + JSON.stringify(post.picture.get('file')._url) );
    $rootScope.show('Please wait, the Instagram plugin is loading...');
    $timeout(function() {
      $rootScope.hide();
      window.plugins.socialsharing.shareViaInstagram(post.geolocation.get("title"), post.picture.get('file')._url, function() {console.log('share ok');}, function(errormsg){alert(errormsg);});
    }, 2000);
  };
  $scope.Share = function(post){
    console.log("MapCtrl ::: Share geolocation: " + JSON.stringify(post.picture.get('file')._url) );
    $rootScope.show('Please wait, the sharing plugin is loading...');
    $timeout(function() {
      $rootScope.hide();
      window.plugins.socialsharing.share(post.description, post.geolocation.get("title"), post.picture.get('file')._url, post.picture.get('file')._url, function() {console.log('share ok');}, function(errormsg){alert(errormsg);});
    }, 2000);
  };
  $scope.Upload = function(geolocation){
    console.log("MapCtrl ::: Upload geolocation ID: " + geolocation.id );
    mapService.selectedGeoloc = geolocation;
    $scope.hideGeoModal();
    $state.go('app.upload');
  };
  $scope.Report = function(post){
    console.log("MapCtrl ::: REPORT Picture ID: " + post.picture.id);
    if (userService.userLoggedIn) {
      var confirmPopup = $ionicPopup.confirm({
        title: 'Report a picture',
        template: 'Are you sure you want to report this picture?'
      });
      confirmPopup.then(function(res) {
        if(res) {
          postService.Report(post.picture);
          post.reported = true;
        }
      });
    }
    else {
      $scope.hideGeoModal();
      $state.go('app.userpictures');
    }
  };
  $scope.Like = function(picture, geoTitle){
    console.log("MapCtrl ::: LIKE Picture of the geolocation: " + geoTitle + $scope.processing);
    if ($scope.processing === false) {
      if (userService.userLoggedIn) {
        $scope.processing = true;
        postService.Like(picture);
        // Send a push notification to let the picture owner for the new like:
        Parse.Push.send({
          channels: [ "p_"+picture.id ],
          data: {
            alert: "New like for " + geoTitle,
            goto: "app.userpictures",
            badge: "Increment",
            sound: "cheering.caf"
          }
        }, {
          success: function() {
            console.log("Push was successful");
          },
          error: function(error) {
            console.log("Push error: " + JSON.stringify(error) );
          }
        });
        $timeout(function() {
          $scope.processing = false;
        }, 1000);
      }
      else {
        $scope.hideGeoModal();
        $state.go('app.userpictures');
      }
    }
  };
  $scope.unLike = function(picture){
    console.log("MapCtrl ::: UNLIKE Picture ID: " + picture.id);
    if ($scope.processing === false) {
      $scope.processing = true;
      postService.unLike(picture);
      $timeout(function() {
        $scope.processing = false;
      }, 1000);
    }
  };
  //////////////////////////////////////////////////////////////////
  $scope.$on('$ionicView.afterEnter', function() {
    console.log("-----------------------------------------------------------");
    console.log("MapCtrl afterENTERING THE MAP !!! ");
    if(typeof plugin !== 'undefined') {
      var div = document.getElementById("map_canvas");
      var options = {
        'backgroundColor': 'transparent',
        'mapType': plugin.google.maps.MapTypeId.ROADMAP,
        'controls': {
           'compass': true,
           'myLocationButton': true,
           'indoorPicker': true,
           'zoom': true,
           'pan':true
        },
        'gestures': {
           'scroll': true,
           'tilt': true,
           'rotate': true,
           'zoom': true
        }
      };
      map = plugin.google.maps.Map.getMap(div, options);
      map.setVisible(true);
      if (mapService.selectedGeoloc) {
        map.animateCamera({
          'target': {lat:mapService.selectedGeoloc.get("geolocation").latitude,lng:mapService.selectedGeoloc.get("geolocation").longitude},
          'zoom': 12,
          'tilt': 47,
          'duration': 2000
        });
      }
    }
  });
  $scope.$on('$ionicView.beforeLeave', function() {
    //console.log("MapCtrl beforeLeave --------------- >> HIDDING THE MAP !!! ");
    map = plugin.google.maps.Map.getMap();
    map.setVisible(false);
  });
  //////////////////////////////////////////////////////////////////
  console.log("--------------------------------------------------------------");
  console.log("MapCtrl!!!!!");
  $scope.processing = false;
  ionic.Platform.ready(function () {
    console.log("MapCtrl ionic.Platform.ready FIRING!!!");
    map = plugin.google.maps.Map.getMap();
    map.remove();
    var div = document.getElementById("map_canvas");
    var options = {
      'backgroundColor': 'transparent',
      'mapType': plugin.google.maps.MapTypeId.ROADMAP,
      'controls': {
         'compass': true,
         'myLocationButton': true,
         'indoorPicker': true,
         'zoom': true,
         'pan':true
      },
      'gestures': {
         'scroll': true,
         'tilt': true,
         'rotate': true,
         'zoom': true
      }
    };
    map = plugin.google.maps.Map.getMap(div, options);
    map.setVisible(true);
    navigator.geolocation.getCurrentPosition(
      function (position) {
        //console.log("MapCtrl getCurrentPosition ::: " + JSON.stringify(position) );
        map.animateCamera({
          'target': {lat:position.coords.latitude, lng:position.coords.longitude},
          'zoom': 3,
          'tilt': 0,
          'duration': 10
        });
        mapService.cameraReady = true;
      },
      function (error) {
        console.error('MapCtrl getCurrentPosition ::: ' + JSON.stringify(error));
      },
      { enableHighAccuracy: true }
    );
    map.on(plugin.google.maps.event.MAP_LONG_CLICK, function(latLng) {
      var msg = "Is this your geolocation??";
      console.log("MAP_LONG_CLICK Geolocation: " + latLng.lat + " " + latLng.lng);
      mapService.selectedGeoloc = null;
      mapService.removeAllGeoMarkers();
      mapService.hideAllInfoWindow();
      map.addMarker({
        'position': latLng,
        'title': msg,
        'icon': 'white'
        //'icon': 'www/img/marker.png'
      }, function(marker) {
        mapService.addGeoMarker(marker);
        mapService.longclickpos = latLng;
      });
    });
    map.on(plugin.google.maps.event.MAP_CLICK, function(latLng) {
      mapService.selectedGeoloc = null;
      mapService.removeAllGeoMarkers();
    });
    map.on(plugin.google.maps.event.CAMERA_CHANGE, _.throttle(function(latLng) {
      if (mapService.cameraReady) {
        map.getVisibleRegion(function(latLngBounds) {
          console.log("Camera Changed Geolocation: " + JSON.stringify(latLngBounds.southwest.lat) + " " + JSON.stringify(latLngBounds.northeast.lat) );
          if (latLngBounds.southwest.lat == "-180") {
            // some weird bug...
            console.error("<<<<<< CAMERA_CHANGE: some weird bug >>>>>>");
            //postService.southwestOfSF = new Parse.GeoPoint(-79.999, -179.999);
            //postService.northeastOfSF = new Parse.GeoPoint(79.999, 179.999);
          }
          else if (latLngBounds.southwest.lng > latLngBounds.northeast.lng) {
            // Geo box queries that cross the international date lines are not currently supported so:
            console.log("<<<<<< CAMERA_CHANGE: OUTSITE international date lines >>>>>>");
            postService.southwestOfSF = new Parse.GeoPoint(latLngBounds.southwest.lat,latLngBounds.southwest.lng);
            postService.northeastOfSF = new Parse.GeoPoint(latLngBounds.northeast.lat,179.999);
          }
          else {
            // Inside the international date lines:
            postService.southwestOfSF = new Parse.GeoPoint(latLngBounds.southwest.lat,latLngBounds.southwest.lng);
            postService.northeastOfSF = new Parse.GeoPoint(latLngBounds.northeast.lat,latLngBounds.northeast.lng);
          }
          postService.newgeolocation = true;
          postService.getMapFeed(postService.southwestOfSF, postService.northeastOfSF)
          .then(function(Geolocations){
            //$rootScope.hide();
            console.log("MAP FEED RESULTS LENGTH: " + JSON.stringify(Geolocations.length));
            mapService.removeAllMarkers();
            Geolocations.forEach(function(geolocation) {
              map.addMarker({
                'id': geolocation.id,
                'position': {lat:geolocation.get("geolocation").latitude,lng:geolocation.get("geolocation").longitude},
                'title': geolocation.get("title"),
                //'icon': 'www/img/icon.png',
                'icon': 'white',
                'snippet': geolocation.get("picCount") + " 📷 " + geolocation.get('followers') + " ⭐"
              }, function(marker) {
                if ( mapService.selectedGeoloc && (geolocation.id == mapService.selectedGeoloc.id) ) {
                  marker.showInfoWindow();
                }
                marker.addEventListener(plugin.google.maps.event.INFO_CLICK, function () {
                  console.log("--------------------------------------------");
                  console.log("MARKER.addEventListener:::::plugin.google.maps.event.INFO_CLICK!!!!!!! " + geolocation.id);
                  $scope.showGeoModal(geolocation, geolocation.get('user').get('username'));
                });
                marker.addEventListener(plugin.google.maps.event.MARKER_CLICK, function () {
                  console.log("--------------------------------------------");
                  console.log("MARKER.addEventListener:::::plugin.google.maps.event.MARKER_CLICK!!!!!!! " + geolocation.id);
                  mapService.selectedGeoloc = geolocation;
                  mapService.removeAllGeoMarkers();
                  console.log("MapCtrl :: ---- >> MARKERS: " + JSON.stringify(mapService.selectedGeoloc.id) );
                });
                mapService.addMarker(marker);
              });
            });
          });
        });
      }
    }, 1000, {leading:false}));
  });
})



.controller('SettingsCtrl', function($scope, $ionicHistory, $ionicModal, $state, userService, postService) {
  $scope.UpdateUsername = function() {
    if ( userService.validateUsername($scope.user.username) ) {
      userService.updateUsername($scope.user.username)
      .then(function (result) {
        $scope.username_error = "Username successfully changed";
				console.log("UPDATE SUCCESS loggedUser: " + JSON.stringify(userService.loggedUser));
      }, function(error) {
        console.error("UPDATE ERROR: " + error);
        $scope.username_error = error;
				$scope.user.username = userService.loggedUser.get('username');
				console.error("UPDATE ERROR loggedUser: " + JSON.stringify(userService.loggedUser));
      });
    }
    else {
      $scope.username_error = "Username invalid. Minimum 4 characters with no space nor special characters.";
    }
  };
  $scope.UpdatePassword = function() {
    if ( userService.validatePassword($scope.user.password) ) {
      userService.updatePassword(userService.loggedUser.get('username'),$scope.user.password)
      .then(function (result) {
        console.log('UPDATE PASSWORD SUCCESSSSSS');
        $scope.password_error = "Password successfully changed";
      }, function(error) {
        console.error("UPDATE ERROR: " + error);
        $scope.password_error = error;
      });
    }
    else {
      $scope.password_error = "Password invalid. Minimum 6 characters.";
    }
  };
	$ionicModal.fromTemplateUrl('views/app/legal/terms-of-service.html', {
		scope: $scope,
		animation: 'slide-in-up'
	}).then(function(modal) {
		$scope.terms_of_service_modal = modal;
	});
	$ionicModal.fromTemplateUrl('views/app/legal/privacy-policy.html', {
		scope: $scope,
		animation: 'slide-in-up'
	}).then(function(modal) {
		$scope.privacy_policy_modal = modal;
	});
  $scope.showTerms = function() {
    $scope.terms_of_service_modal.show();
  };
  $scope.showPrivacyPolicy = function() {
    $scope.privacy_policy_modal.show();
  };
  $scope.Logout = function() {
    Parse.User.logOut();
    userService.loggedUser = {};
    userService.userLoggedIn = false;
    console.log("USER LOGGING OUT!!!!");
    postService.emptyLikedPictures();
    postService.userPictures = [];
    $ionicHistory.clearCache()
    .then(function(){
      $state.go('app.map');
    });
  };
  //////////////////////////////////////////////////////////////////
  $scope.$on('$ionicView.beforeEnter', function (event, viewData) {
    viewData.enableBack = true;
  });
  //////////////////////////////////////////////////////////////////
  console.log("--------------------------------------------------------------");
  console.log("SettingsCtrl: " + JSON.stringify(userService.loggedUser) );
  $scope.user = {};
  $scope.user.username = userService.loggedUser.get('username');
})
;
