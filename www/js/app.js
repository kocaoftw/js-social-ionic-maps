angular.module('underscore', [])
.factory('_', function() {
  return window._; // assumes underscore has already been loaded on the page
});

angular.module('your_app_name', [
  'ionic',
  'your_app_name.directives',
  'your_app_name.controllers',
  'your_app_name.services',
  'your_app_name.views',
  'underscore',
  'angularMoment',
  'ngCordova',
  'ngIOS9UIWebViewPatch' //patch for iOS9
])

.run(function($ionicPlatform, $rootScope, $state, $ionicHistory, $window, $ionicLoading) {
  // Connect to your data on Parse.com using your Application ID and your JavaScript Key.
  Parse.initialize("lC4lUgecMFiI2ikkvvMLmwRmLGWcUm8I7CwYElqL", "41OhKVoaYXxj4VZqUBsT7NXlfaVYjEgbLGhQqT6i");
  $ionicPlatform.ready(function() {
    if(window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    }
    if(window.StatusBar) {
      StatusBar.styleDefault();
    }
    // Parse Push notification initialization using your Application ID and your Client Key.
    parsePlugin.initialize("lC4lUgecMFiI2ikkvvMLmwRmLGWcUm8I7CwYElqL", "8izQgvMd2f66KGdPprNNPSYIS6Vvl2neKYwHQ6Ys", function() {
      parsePlugin.subscribe('Everybody', function() {
        parsePlugin.getInstallationId(function(id) {
          console.log("parsePlugin.getInstallationId: " + id);
        }, function(error) {
            console.error('parsePlugin.getInstallationId error: ' + error);
        });
      }, function(error) {
        console.error('parsePlugin.subscribe error: ' + error);
      });
    }, function(error) {
      console.error('parsePlugin.initialize error: ' + error);
    });
    parsePlugin.registerCallback('onNotification', function() {
      window.onNotification = function(pnObj) {
        parsePlugin.resetBadge();
        if (pnObj.receivedInForeground === false) {
          $state.go(pnObj.goto);
        }
      };
    }, function(error) {
      console.error(error);
    });
  });
  // some global loading and notification functions
  $rootScope.show = function(text) {
    $rootScope.loading = $ionicLoading.show({
      template: text ? text : 'Loading...',
      animation: 'fade-in',
      showBackdrop: true,
      maxWidth: 500,
      showDelay: 0
    });
  };
  $rootScope.hide = function() {
    $ionicLoading.hide();
  };
  $rootScope.longnotify = function(text) {
    $rootScope.show(text);
    $window.setTimeout(function() {
      $rootScope.hide();
    }, 2999);
  };
  $rootScope.quicknotify = function(text) {
    $rootScope.show(text);
    $window.setTimeout(function() {
      $rootScope.hide();
    }, 999);
  };
})

.config(function ($ionicConfigProvider) {
  //console.log("app config");
  if (ionic.Platform.isAndroid()) {
    $ionicConfigProvider.scrolling.jsScrolling(false);
    $ionicConfigProvider.tabs.position("bottom");
  }
})

.config(function($stateProvider, $urlRouterProvider) {
  $stateProvider
  .state('app', {
    url: "/app",
    abstract: true,
    templateUrl: "views/app/tabs.html"
  })
  .state('app.map', {
    cache: true,
    url: '/map',
    views: {
      'tab-map': {
        templateUrl: 'views/app/map.html',
        controller: 'MapCtrl'
      }
    }
  })
  .state('app.geofeed', {
    cache: true,
    url: "/geofeed",
    views: {
      'tab-geofeed': {
        templateUrl: "views/app/geofeed.html",
        controller: "GeoFeedCtrl"
      }
    }
  })
  .state('app.upload', {
    cache: false,
    url: '/upload',
    views: {
      'tab-upload': {
        templateUrl: 'views/app/upload.html',
        controller: 'UploadCtrl'
      }
    }
  })
  .state('app.following', {
    cache: true,
    url: "/following",
    views: {
      'tab-following': {
        templateUrl: "views/app/following.html",
        controller: "FollowingCtrl"
      }
    }
  })
  .state('app.userpictures', {
    cache: true,
    url: "/userpictures",
    views: {
      'tab-profile': {
        templateUrl: "views/app/userpictures.html",
        controller: 'UserPicCtrl'
      }
    }
  })
  .state('geolocalise', {
    cache: false,
    url: '/geolocalise',
    templateUrl: 'views/app/geolocalise.html',
    controller: 'GeolocaliseCtrl'
  })
  .state('edit', {
    cache: false,
    url: '/edit/:picId',
    templateUrl: 'views/app/edit.html',
    controller: 'EditCtrl'
  })
  .state('settings', {
    url: "/settings",
    templateUrl: "views/app/settings.html",
    controller: 'SettingsCtrl'
  })
  .state('welcome', {
    url: "/welcome",
    templateUrl: "views/auth/welcome.html",
    controller: 'WelcomeCtrl'
  })
  .state('register', {
    url: "/register",
    templateUrl: "views/auth/register.html",
    controller: 'RegisterCtrl'
  })
  .state('login', {
    url: "/login",
    templateUrl: "views/auth/login.html",
    controller: 'LoginCtrl'
  })
  ;
  $urlRouterProvider.otherwise('/welcome');
})
;
