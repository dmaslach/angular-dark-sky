angular-dark-sky
================

Angular.js provider for fetching current and forecasted (7 days) weather data using the Dark Sky API.

An API key from [darksky.net/dev/](https://darksky.net/dev/) is required in order to use this provider. See https://darksky.net/dev/ for further information. 

A directive is also included that maps the Dark Sky weather condition IDs
to the excellent [weather-icons](http://erikflowers.github.io/weather-icons/) by
Erik Flowers.

Getting started
---------------

 * Include Scripts - the provider script should be included after the AngularJS script:

        <script type='text/javascript' src='path/to/angular.min.js'></script>
        <script type='text/javascript' src='path/to/angular-dark-sky.js'></script>

 * Specifiy Dependency - ensure that your application module specifies dark-sky as a dependency:

        angular.module('myApp', ['dark-sky']);

 * Configure the provider by setting the API key:

        app.config(['darkSkyProvider', function(darkSkyProvider) {
            darkSkyProvider
                .setApiKey('XXXXXXX');
        }]);

 * Inject service - inject `darkSky` service into your Ctrl/directive/service/etc:

 		angular.module('app.weatherWidget')
	        .controller('WeatherCtrl', [
	        	'$q', darkSky',
	        	function($q, darkSky) {
		        	activate();

		        	// log current weather data
		        	function activate() {
		        		getNavigatorCoords()
			        		.then(function(latitude, longitude) {
			        			darkSky.getCurrent(latitude, longitude)
			        				.then(console.log)
			        				.catch(console.warn);
			        		})
			        		.catch(console.warn);
			        }

					// Get current location coordinates if supported by browser
		        	function getNavigatorCoords() {
		        		var deferred = $q.defer();

		        		// check for browser support
        				if ("geolocation" in navigator) {
	        				// get position / prompt for access
	          				navigator.geolocation.getCurrentPosition(function(position) {
	          					deferred.resolve(position);
	          				});
          				} else {
          					deferred.reject('geolocation not supported');
          				}
          				return deferred.promise;
		        	}
	        	}]);

Provider API
------------

The `darkSky` provider exposes the following Forecast.IO API methods to fetch data:

 * `darkSky.getCurrent(43.0667, 89.4000)`: Get current weather data
 * `darkSky.getForecast(43.0667, 89.4000)`: Get forecasted weather data

Both methods take latitude and longitude and return an angular Promise which resolves with the data object as retrieved from Forecast.IO. The promise is rejected if there was an error. See [data points]https://darksky.net/dev/docs/response#data-point) for an explaination of the data structure retrieved.

### Configuration

 * `darkSkyProvider.setApiKey('XXXXXXX')`: Set Forecast.IO API key
 * `darkSkyProvider.setUnits('us')`: Set unit type for response formatting, see
 	 the [list of supported units](https://darksky.net/dev/docs/forecast). Defaults to 'us'.
 * `darkSkyProvider.setLanguage('en')`: Set language for response summaries, see
 	 the [list of supported languages](https://darksky.net/dev/docs/forecast). Defaults to 'en'.

Directive
---------

Using the directive is simple, just pass the weather condition ID:

    <dark-sky-icon icon="{{ item.icon }}"></dark-sky-icon>

For the directive to be able to display any icons, please install the
[weather-icons](http://erikflowers.github.io/weather-icons/) package.