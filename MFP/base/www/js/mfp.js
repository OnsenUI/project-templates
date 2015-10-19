// MobileFirst Platform init

angular.module('app')

.run(function(MFPClientPromise) {
  ons.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
      cordova.plugins.Keyboard.disableScroll(true);

    }
    if (window.StatusBar) {
      // org.apache.cordova.statusbar required
      StatusBar.styleLightContent();
    }
    MFPClientPromise.then(function(){WL.Logger.ctx({pkg: 'io.onsen'}).debug('MFP and Onsen UI are ready, safe to use WL.* APIs');});
  });
})

.factory('MFPClientPromise', function($q){
  /* Setup a Promise to allow code to run in other places anytime after MFP CLient SDK is ready
     Example: MFPClientPromise.then(function(){alert('mfp is ready, go ahead and use WL.* APIs')});
  */
  return window.MFPClientDefer.promise;
});


window.Messages = {
  // Add here your messages for the default language.
  // Generate a similar file with a language suffix containing the translated messages.
  // key1 : message1,
};

window.wlInitOptions = {
  // Options to initialize with the WL.Client object.
  // For initialization options please refer to IBM MobileFirst Platform Foundation Knowledge Center.
};

window.MFPClientDefer = angular.injector(['ng']).get('$q').defer();
window.wlCommonInit = window.MFPClientDefer.resolve;
window.MFPClientDefer.promise.then(function wlCommonInit(){
  // Common initialization code goes here or use the angular service MFPClientPromise

  console.log('MobileFirst Client SDK Initilized');

});
