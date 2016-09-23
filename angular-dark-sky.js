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
            _config = {
                baseUri: 'https://api.darksky.net/',
                baseExclude: 'exclude=alerts,flags,hourly,minutely'
            },
            units = 'us',
            language = 'en';

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
         * @ref https://developer.forecast.io/docs/v2#options
         */
        this.setUnits = function(value) {
            units = value;
            return this;
        };

        /**
         * Set language for response summaries
         * @param {String} value - language token
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

            if (!apiKey) {
                console.warn('No Dark Sky API key set.');
            }

            return service;

            /** Public Methods */

            /**
             * Get current weather data
             * @param {Number} latitude
             * @param {Number} longitude
             * @returns {Promise} - resolves with current weather data object
             */
            function getCurrent(latitude, longitude) {
                return api(latitude, longitude).current();
            }

            /**
             * Get daily weather data
             * @param {Number} latitude
             * @param {Number} longitude
             * @returns {Promise} - resolves with daily weather data object
             */
            function getForecast(latitude, longitude) {
                return api(latitude, longitude).forecast();
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
                        // exclude daily weather data from response
                        var query = '&' + excludeString('daily');
                        return fetch(latitude, longitude, query);
                    },
                    forecast: function() {
                        // exclude current weather data from response
                        var query = '&' + excludeString('currently');
                        return fetch(latitude, longitude, query);
                    }
                };
            }

            /**
             * Perform http jsonp request for weather data
             * @param {Number} latitude
             * @param {Number} longitude
             * @param query {String} - additional request params query string
             * see {@link https://developer.forecast.io/docs/v2#options}
             * @returns {Promise} - resolves to weather data object
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
             * @param {String} toExclude - comma separated list with no spaces of blocks to exclude
             * @returns {String} - exclude query string with base excludes and your excludes
             */
            function excludeString(toExclude) {
                return _config.baseExclude + ',' + toExclude;
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