/**
 * angular-dark-sky
 *
 * A simple & configurable provider for the Dark Sky API including icon directive using weather-icons
 *
 * @link https://github.com/deanbot/angular-dark-sky
 * @see {@link https://darksky.net/dev/}
 * @see {@link https://darksky.net/dev/docs/|Docs}
 * @see {@link http://erikflowers.github.io/weather-icons|weather-icons}
 * @author Dean Verleger <deanverleger@gmail.com>
 * @license MIT License, http://www.opensource.org/licenses/MIT

 */
(function() {
  'use strict';

  angular.module('dark-sky', [])
    .provider('darkSky', darkSkyProvider)
    .directive('darkSkyIcon', ['darkSky', darkSkyIcon]);

  /**
   * Dark Sky weather data provider
   */
  function darkSkyProvider() {
    var apiKey,
      config = {
        baseUri: 'https://api.darksky.net/forecast/',
        baseExclude: '&exclude=',
        acceptedUnits: ['auto', 'ca', 'uk2', 'us', 'si'],
        acceptedLanguage: [ 
          'ar', 'az', 'be', 'bs', 'cs', 'de', 'el', 'en', 'es', 'fr', 'hr', 'hu', 'id', 'it', 'is', 'kw', 'nb', 'nl', 'pl', 'pt', 'ru', 'sk', 'sr', 'sv', 'tet', 'tr', 'uk', 'x-pig-latin', 'zh', 'zh-tw'
        ]
      },
      units = 'us', // default unit
      language = 'en'; // default language
		
    /**
     * Set API key for request
     * @param {String} value - your Dark Sky API key
     */
    this.setApiKey = function(value) {
      apiKey = value;
      return this;
    };

	this.setLatitude = function(value) {
		var latitude = value;
		return this;
	};
	
	this.setLongitude = function(value) {
		var longitude = value;
		return this;
	}
	
    /**
     * Set unit type for response formatting
     * @param {String} value - unit token
     */
    this.setUnits = function(value) {
      if (_.indexOf(config.acceptedUnits, value) === -1) {
        console.warn(value + ' not an accepted API unit.');
      }
      units = value;
      return this;
    };

    /**
     * Set language for response summaries
     * @param {String} value - language token
     */
    this.setLanguage = function(value) {
      if (_.indexOf(config.acceptedLanguage, value) === -1) {
        console.warn(value + ' not an accepted API language.');
      }
      language = value;
      return this;
    };

    /**
     * Service definition
     */
    this.$get = ['$http', '$q', function($http, $q) {
      var service = {
		getWeather: getWeather
      };
      if (!apiKey) {
        console.warn('No Dark Sky API key set.');
      }
      return service;

      /** Public Methods */

      /**
       * Get current weather data
       * @param {number} latitude position
       * @param {number} longitude position
	   * @param {array} elements to retrieve ('alerts', 'currently', 'daily', 'flags', 'hourly', 'minutely'). Enclose with []
       * @param {object} [options] - additional query options
       * ... {unix timestamp} options.time - send timestamp for timemachine requests
       * ... {boolean} options.extend - pass true for extended forecast 
       * @returns {promise} - resolves with current weather data object
       */

	  function getWeather(latitude, longitude, data, options) {
		  return api(latitude, longitude, data, options).getData();
	  }
	  
      /**
       * Get units object showing units returned based on configured language/units
       * @returns {object} units
       */
      function getUnits() {
        var unitsObject,
          // per API defualt assume 'us' if omitted 
          unitId = 'us';

        // determine unit id
        if (units) {
          if (units === 'auto') {
            console.warn('Can\'t guess units. Defaulting to Imperial');
            unitId = 'us';
          } else {
            unitId = units;
          }
        }

        // get units object by id
        switch (unitId) {
          case 'ca':
            unitsObject = getCaUnits();
            break;
          case 'uk2':
			unitsObject = getUk2Units();
            break;
          case 'us':
            unitsObject = getUsUnits();
            break;
          case 'si':
            unitsObject = getSiUnits();
            break;
        }
        return unitsObject;
      }

      /** Private Methods */

      /**
       * Expose API methods with latitude and longitude mapping
       * @param {number} latitude
       * @param {number} longitude
       * @param {object} options
       * @returns {oObject} - object with API method properties
       */
      function api(latitude, longitude, options, data) {
        var time;

        // check for time option
        if (options && options.time) {
          time = options.time;
          if (!moment(time).isValid()) {
            console.warn('Specified time is not valid');
          }
        }
        return {

		  getData: function() {
			var query = excludeString(data) + optionsString(options);
			return fetch(latitude, longitude, query, time);
		  }
        };
      }

      /**
       * Get exclude items by excluding all items except what is passed in
       * @param {string} toRetrieve - single block to include in results
       * @returns {string} - exclude query string with base excludes and your excludes
       */
      function excludeString(toRetrieve) {
        var blocks = ['alerts', 'currently', 'daily', 'flags', 'hourly', 'minutely'],
		  excludes = _.difference(blocks, toRetrieve),
          query = _.join(excludes, ',');
        return config.baseExclude +  query;
      }

      /**
       * Get query string for additional API options
       * @param {object} options
       * @returns {string} additional options query string
       */
      function optionsString(options) {
        var defaults = {
            extend: false
          },
          atts = _.defaults(options, defaults),
          query = '';
		  
		if (!options) {						
		// Added because original code returned options as 'undefined' causing issue when getting data (excludes had 'mintutesundefined' rather than just 'minutes')
			return options = '';		
		}
        if (options) {
          // parse extend option
          if (atts.extend) {
            return query += '&extend=hourly';		
          }
        }
      }

      /**
       * Perform http jsonp request for weather data
       * @param {number} latitude - position latitude
       * @param {number} longitude - position longitude
       * @param {string} query - additional request params query string
       * @param {number} time - timestamp for timemachine requests
       * @returns {promise} - resolves to weather data object
       */
      function fetch(latitude, longitude, query, time) {
        var time = time ? ', ' + time : '',
          url = [config.baseUri, apiKey, '/', latitude, ',', longitude, time, '?units=', units, '&lang=', language, query, '&callback=JSON_CALLBACK', '&Accept-Encoding:gzip'].join('');
        return $http
          .jsonp(url)
          .then(function(results) {
            // check response code
            if (parseInt(results.status) === 200) {
              winddirection(results);
			  dailyBars(results);
			  tempDirection(results);
			  return results.data;
            } else {
              return $q.reject(results);
            }
          })
          .catch(function(data, status, headers, config) {
            return $q.reject(status);
          });
      }

	  // convert wind bearing degrees to cardinal direction, return nothing if no wind
	  function winddirection (results) {
		if (!results.data.currently.windBearing) {
			return '';
		}
		else {
			var windBearing = results.data.currently.windBearing;
			while( windBearing < 0 ) windBearing += 360 ;
			while( windBearing >= 360 ) windBearing -= 360 ; 
			var val= Math.round( (windBearing -11.25 ) / 22.5 ) ;
			var arr=["N","NNE","NE","ENE","E","ESE", "SE","SSE","S","SSW","SW","WSW","W","WNW","NW","NNW"] ;
			var windDirection = arr[ Math.abs(val) ] ;
			
			return results.data.currently.windBearing = windDirection;
		}
	  }
	  
	  function dailyBars (results) {
		var numDays = Math.max(6, results.data.daily.data.length);
		var tempRange = -Infinity;
		var maxOverallTemp = -Infinity;
        var minOverallTemp = Infinity;
		
		for (var d = 0; d < numDays; d++) {
			tempRange = results.data.daily.data[d];
			tempRange.temperatureMax > maxOverallTemp  && (maxOverallTemp = tempRange.temperatureMax); 
			tempRange.temperatureMin < minOverallTemp && (minOverallTemp = tempRange.temperatureMin);
	  }
		var barSpace = 82;
		var tempDiff = maxOverallTemp - minOverallTemp;
        for (var d = 0; d < numDays; d++) {
            //(function(results) {
			tempRange = results.data.daily.data[d];
            var height = barSpace * (tempRange.temperatureMax - tempRange.temperatureMin) / tempDiff;
            var top = barSpace * (maxOverallTemp - tempRange.temperatureMax) / tempDiff;
				
				//forEach(results.data.daily.data,function(v) {
					results.data.daily.data[d].height = height;
					results.data.daily.data[d].top = top;
				//});
			}
           // })
		return results;
	
	  }
	  
	  function tempDirection (results) {
        if (!results.data.hourly) {		// if no hourly data, then don't process this
			results.data.currently.data.tempDirection = '';
		}
		else {
			var r = (new Date).getTime() / 1e3,
			hourlyData = results.data.hourly.data;
			var l = 0;
			
			for (var c = 0; c < hourlyData.length; c++) {
					if (hourlyData[c].time < r) continue;
					l = hourlyData[c].temperature > results.data.currently.temperature ? 1 : -1;
					break;
				}
			if (l = 1) {
				results.data.currently.tempDirection = 'and rising';
			}
			else if (l = -1) {
				results.data.currently.tempDirection = 'and falling';
			}	
			else {
				results.data.currently.tempDirection = '';
			}
		
		}
		return results;
	  }

      /**
       * Return the us response units
       * @returns {object} units
       */
      function getUsUnits() {
        return {
          nearestStormDistance: 'mi',
          precipIntensity: 'in/h',
          precipIntensityMax: 'in/h',
          precipAccumulation: 'in',
          temperature: 'f',
          temperatureMin: 'f',
          temperatureMax: 'f',
          apparentTemperature: 'f',
          dewPoint: 'f',
          windSpeed: 'mph',
          pressure: 'mbar',
          visibility: 'mi'
        };
      }

      /**
       * Return the si response units
       * @returns {object} units
       */
      function getSiUnits() {
        return {
          nearestStormDistance: 'km',
          precipIntensity: 'mm/h',
          precipIntensityMax: 'mm/h',
          precipAccumulation: 'cm',
          temperature: 'c',
          temperatureMin: 'c',
          temperatureMax: 'c',
          apparentTemperature: 'c',
          dewPoint: 'c',
          windSpeed: 'mps',
          pressure: 'hPa',
          visibility: 'km'
        };
      }

      /** 
       * Return ca response units
       * @returns {object} units
       */
      function getCaUnits() {
        var unitsObject = getUsUnits();
        unitsObject.windSpeed = 'km/h';
        return unitsObject;
      }

      /**
       * Return uk2 response units
       * @returns {object} units
       */
      function getUk2Units() {
        var unitsObject = getSiUnits();
        unitsObject.nearestStormDistance = unitsObject.visibility = 'mi';
        unitsObject.windSpeed = 'mph';
        return unitsObject;
      }

    }];
  }

  /**
   * Dark Sky weather-icons directive
   * @example <dark-sky-icon icon="{{ icon }}"></dark-sky-icon>
   * @see {@link http://erikflowers.github.io/weather-icons}
   */
  function darkSkyIcon(darkSky) {
    return {
      restrict: 'E',
      scope: {
        icon: '@'
      },
      template: '<i class="wi wi-forecast-io-{{ icon }} wi-dark-sky-{{ icon }}"></i>'
    };
  }

})();