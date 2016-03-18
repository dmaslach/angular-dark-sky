angular-forecast-io
================

Angular.js provider for fetching current and forecasted (7 days) weather data using the forecast.io API.

An API key from [Forecast.IO](http://http://forecast.io/) is required in order to use this provider. See https://developer.forecast.io/ for further information. Honorable mention to [ng-weathermap](https://github.com/OpenServices/ng-weathermap) for which much formatting is derived.

A directive is also included that maps Forecast.io weather condition IDs
to the excellent [weather-icons](http://erikflowers.github.io/weather-icons/) by
Erik Flowers.

Getting started
---------------

 * Include Scripts - the provider script should be included after the AngularJS script:

        <script type='text/javascript' src='path/to/angular.min.js'></script>
        <script type='text/javascript' src='path/to/angular-forecast-io.js'></script>

 * Specifiy Dependency - ensure that your application module specifies forecast-io as a dependency:

        angular.module('myApp', ['forecast-io']);

 * Configure the provider by setting the API key:

        app.config(['forecastIOProvider', function(forecastIOProvider) {
            forecastIOProvider
                .setApiKey('XXXXXXX');
        }]);
 
 * Inject service - inject `forecastIO` service into your Ctrl/directive/service/etc:

 		angular.module('app.weatherWidget')
	        .controller('WeatherCtrl', [
	        	'$q', forecastIO',
	        	function($q, forecastIO) {
		        	activate();

		        	// log current weather data
		        	function activate() {
		        		getNavigatorCoords()
			        		.then(function(latitude, longitude) {
			        			forecastIO.getCurrent(latitude, longitude)
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

The `forecastIO` provider exposes the following Forecast.IO API methods to fetch data:

 * `forecastIO.getCurrent(43.0667, 89.4000)`: Get current weather data
 * `forecastIO.getForecast(43.0667, 89.4000)`: Get forecasted weather data

Both methods take latitude and longitude and return an angular Promise which resolves with the data object as retrieved from Forecast.IO. The promise is rejected if there was an error. See [data points](https://developer.forecast.io/docs/v2#data-points) for an explaination of the data structure retrieved.

### Configuration

 * `forecastIOProvider.setApiKey('XXXXXXX')`: Set Forecast.IO API key
 * `forecastIOProvider.setUnits('us')`: Set unit type for response formatting, see
 	 the [list of supported units](https://developer.forecast.io/docs/v2#options). Defaults to 'us'.
 * `forecastIOProvider.setLanguage('en')`: Set language for response summaries, see
 	 the [list of supported languages](https://developer.forecast.io/docs/v2#options). Defaults to 'en'.

Directive
---------

Using the directive is simple, just pass the weather condition ID:

    <forecast-io-icon icon="{{ item.icon }}"></forecast-io-icon>

For the directive to be able to display any icons, please install the
[weather-icons](http://erikflowers.github.io/weather-icons/) package.