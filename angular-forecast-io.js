/**
 * angular-forecast-io
 *
 * A simple & configurable provider for forecast.io weather data api
 *
 * @link https://github.com/deanbot/angular-forecast-io
 * @ref https://developer.forecast.io/docs/v2
 * @author Dean Verleger <deanverleger@gmail.com>
 * @license MIT License, http://www.opensource.org/licenses/MIT
 */
(function () {
  'use strict';

  angular.module('forecast-io', [])
    .provider('forecastIO', forecastIOProvider);

  function forecastIOProvider() {
    var apiKey,
    _config = {
      baseUri: 'https://api.forecast.io/forecast/',
      baseExclude: 'exclude=alerts,flags,hourly,minutely'
    },
    units = 'us',
    language = 'en';

    /**
     * Set api key for request
     * @params value {String} - your forecast.io api key
     * @ref https://developer.forecast.io/register
     */
    this.setApiKey = function(value) {
      apiKey = value;
      return this;
    };

    /**
     * Set unit type for response formatting
     * @params value {String} - unit token
     * @ref https://developer.forecast.io/docs/v2#options
     */
    this.setUnits = function(value) {
      units = value;
      return this;
    }

    /**
     * Set language for response summaries
     * @params value {String} - language token
     * @ref https://developer.forecast.io/docs/v2#options
     */
    this.setLanguage = function(value) {
      language = value;
      return this;
    };

    /**
     * Service definition
     */
    this.$get = ['$http', '$q', function($http, $q) {
      var service = {
        getCurrent: getCurrent,
        getForecast: getForecast
      };

      if (!apiKey)
        console.warn('No forecast.io API key set.');

      return service;

      /** Public Methods */

      /**
       * Get current weather data
       * @params latitude {Number}
       * @params longitude {Number}
       * @return {Promise} - resolves with current weather data object
       */
      function getCurrent(latitude, longitude) {
        return api(latitude, longitude).current();
      }

      /**
       * Get daily weather data
       * @params latitude {Number}
       * @params longitude {Number}
       * @return {Promise} - resolves with daily weather data object
       */
      function getForecast(latitude, longitude) {
        return api(latitude, longitude).forecast();
      }

      /** Private Methods */
      
      /**
       * Expose api methods with latitude and longitude mapping
       * @params latitude {Number}
       * @params longitude {Number}
       * @return {Object} - Objec with API method properties
       */
      function api(latitude, longitude) {
        return {
          current: function() {
            // exclude daily weather data from response
            var query = '&' + excludeString('daily');
            return fetch(latitude, longitude, query);
          },
          forecast7: function() {
            // exclude current weather data from response
            var query = '&' + excludeString('currently');
            return fetch(latitude, longitude, query);
          }
        };
      }

      /**
       * Perform http jsonp request for weather data
       * @params latitude {Number}
       * @params longitude {Number}
       * @params query {String} - additional request params query string
       *  .. see https://developer.forecast.io/docs/v2#options
       * @return {Promise} - resolves to weather data object
       */
      function fetch(latitude, longitude, query) {
        var url = [_config.baseUri, apiKey, '/', latitude, ',', longitude, '?units=', units, '&lang=', language, query, '&callback=JSON_CALLBACK'].join('');
        return $http
          .jsonp(url)
          .then(function(results) {
            // check response code
            if (parseInt(results.status) === 200) {
              return results.data
            } else {
              return $q.reject(results);
            }
          })
          .catch(function(data, status, headers, config) {
            return $q.reject(status);
          });
      }

      /**
       * Get exclude items decorated with base exclude string
       * @params toExclude {String} - comma separated list with no spaces of blocks to exclude
       * @return {String} - exclude query string with base excludes and your excludes
       */
      function excludeString(toExclude) {
        return _config.baseExclude + ',' + toExclude;
      }
      
    }];
  }

})();