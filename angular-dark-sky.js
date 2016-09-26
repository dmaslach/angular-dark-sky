/**
 * angular-dark-sky
 *
 * A simple & configurable provider for the dark sky api including icon directive using weather-icons
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
   * forecast.io weather data provider
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
     * Set api key for request
     * @param {String} value - your forecast.io api key
     */
    this.setApiKey = function(value) {
      apiKey = value;
      return this;
    };

    /**
     * Set unit type for response formatting
     * @param {String} value - unit token
     */
    this.setUnits = function(value) {
      if (_.indexOf(config.acceptedUnits, value) === -1) {
        console.warn(value + ' not an accepted api unit');
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
        console.warn(value + ' not an accepted api language');
      }
      language = value;
      return this;
    };

    /**
     * Service definition
     */
    this.$get = ['$http', '$q', function($http, $q) {
      var service = {
        getCurrent: getCurrent,
        getForecast: getForecastDaily,
        getDailyForecast: getForecastDaily,
        getForecastHourly: getForecastHourly,
        getForecastMinutely: getForecastMinutely,
        getAlerts: getAlerts,
        getFlags: getFlags
      };

      if (!apiKey) {
        console.warn('No Dark Sky API key set.');
      }

      return service;

      /** Public Methods */

      /**
       * Get current weather data
       * @param {Number} latitude
       * @param {Number} longitude
       * @param {object} options
       * @returns {Promise} - resolves with current weather data object
       */
      function getCurrent(latitude, longitude, options) {
        return api(latitude, longitude).current();
      }

      /**
       * Get daily weather data
       * @param {Number} latitude
       * @param {Number} longitude
       * @param {object} options
       * @returns {Promise} - resolves with daily weather data object
       */
      function getForecastDaily(latitude, longitude, options) {
        return api(latitude, longitude).daily();
      }

      /**
       * Get hourly weather data
       * @param {Number} latitude
       * @param {Number} longitude
       * @param {object} options
       * @returns {Promise} - resolves with hourly weather data object
       */
      function getForecastHourly(latitude, longitude, options) {
        return api(latitude, longitude).hourly();
      }

      /**
       * Get minutely weather data
       * @param {Number} latitude
       * @param {Number} longitude
       * @param {object} options
       * @returns {Promise} - resolves with minutely weather data object
       */
      function getForecastMinutely(latitude, longitude, options) {
        return api(latitude, longitude).minutely();
      }

      /**
       * Get alerts weather data
       * @param {Number} latitude
       * @param {Number} longitude
       * @param {object} options
       * @returns {Promise} - resolves with alerts weather data object
       */
      function getAlerts(latitude, longitude, options) {
        return api(latitude, longitude).alerts();
      }

      /**
       * Get units object showing units returned based on configured language/units
       */
      function getUnits() {
        var unitsObject,
          // per api defualt assume us if omitted 
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
       * Expose api methods with latitude and longitude mapping
       * @param {Number} latitude
       * @param {Number} longitude
       * @returns {Object} - object with API method properties
       */
      function api(latitude, longitude) {
        return {
          current: function() {
            var query = excludeString('currently');
            return fetch(latitude, longitude, query);
          },
          daily: function() {
            var query = excludeString('daily');
            return fetch(latitude, longitude, query);
          },
          hourly: function() {
            var query = excludeString('hourly');
            return fetch(latitude, longitude, query);
          },
          minutely: function() {
            var query = excludeString('minutely')
            return fetch(latitude, longitude, query);
          },
          alerts: function() {
            var query = excludeString('alerts');
            return fetch(latitude, longitude, query);
          },
          flags: function() {
            var query = excludeString('flags');
            return fetch(latitude, longitude, query);
          }
        };
      }

      /**
       * Get exclude items by excluding all items except what is passed in
       * @param {String} toRetrieve - single block to include in results
       * @returns {String} - exclude query string with base excludes and your excludes
       */
      function excludeString(toRetrieve) {
        var blocks = ['alerts', 'currently', 'daily', 'flags', 'hourly', 'minutely'],
          excludes = _.filter(blocks, toRetrieve),
          query = _.join(excludes, ',');
        return config.baseExclude +  query;
      }

      /**
       * Perform http jsonp request for weather data
       * @param {Number} latitude
       * @param {Number} longitude
       * @param query {String} - additional request params query string
       * @returns {Promise} - resolves to weather data object
       */
      function fetch(latitude, longitude, query) {
        var url = [config.baseUri, apiKey, '/', latitude, ',', longitude, '?units=', units, '&lang=', language, query, '&callback=JSON_CALLBACK'].join('');
        return $http
          .jsonp(url)
          .then(function(results) {
            // check response code
            if (parseInt(results.status) === 200) {
              return results.data;
            } else {
              return $q.reject(results);
            }
          })
          .catch(function(data, status, headers, config) {
            return $q.reject(status);
          });
      }

      /**
       * Return the us units
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
       * Return the si units
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
       * Return ca units
       * @returns {object} units
       */
      function getCaUnits() {
        var unitsObject = getUsUnits();
        unitsObject.windSpeed = 'km/h';
        return unitsObject;
      }

      /**
       * Return uk2 units
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
   * forecast.io weather-icons directive
   * @example <dark-sky-icon icon="{{ icon }}"></dark-sky-icon>
   * @see {@link http://erikflowers.github.io/weather-icons}
   */
  function darkSkyIcon(darkSky) {
    return {
      restrict: 'E',
      scope: {
        icon: '@'
      },
      template: '<i class="wi wi-forecast-io-{{ icon }}"></i>'
    };
  }

})();