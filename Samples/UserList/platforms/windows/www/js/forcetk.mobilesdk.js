/*
 * Copyright (c) 2013-present, salesforce.com, inc.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification, are permitted provided
 * that the following conditions are met:
 *
 * Redistributions of source code must retain the above copyright notice, this list of conditions and the
 * following disclaimer.
 *
 * Redistributions in binary form must reproduce the above copyright notice, this list of conditions and
 * the following disclaimer in the documentation and/or other materials provided with the distribution.
 *
 * Neither the name of salesforce.com, inc. nor the names of its contributors may be used to endorse or
 * promote products derived from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED
 * WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A
 * PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
 * ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED
 * TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION)
 * HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
 * NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 * POSSIBILITY OF SUCH DAMAGE.
 */

(function ($j) {

    // Version this js was shipped with
    var SALESFORCE_MOBILE_SDK_VERSION = "4.0.0";

    /*
     * JavaScript library to wrap REST API on Visualforce. Leverages Ajax Proxy
     * (see http://bit.ly/sforce_ajax_proxy for details). Based on forcetk.js,
     * but customized for consumption from within the Mobile SDK.
     *
     * Note that you must add the REST endpoint hostname for your instance (i.e.
     * https://na1.salesforce.com/ or similar) as a remote site - in the admin
     * console, go to Your Name | Setup | Security Controls | Remote Site Settings
     */

    var forcetk = this.forcetk;

    if (forcetk === undefined) {
        forcetk = this.forcetk = {};
    }

    if (forcetk.Client === undefined) {

        /**
         * The Client provides a convenient wrapper for the Force.com REST API,
         * allowing JavaScript in Visualforce pages to use the API via the Ajax
         * Proxy.
         * @param [clientId=null] 'Consumer Key' in the Remote Access app settings
         * @param [loginUrl='https://login.salesforce.com/'] Login endpoint
         * @param [proxyUrl=null] Proxy URL. Omit if running on Visualforce or
         *                  Cordova etc
         * @constructor
         */
        forcetk.Client = function (clientId, loginUrl, proxyUrl) {
            forcetk.Client(clientId, loginUrl, proxyUrl, null);
        }

        /**
         * The Client provides a convenient wrapper for the Force.com REST API,
         * allowing JavaScript in Visualforce pages to use the API via the Ajax
         * Proxy.
         * @param [clientId=null] 'Consumer Key' in the Remote Access app settings
         * @param [loginUrl='https://login.salesforce.com/'] Login endpoint
         * @param [proxyUrl=null] Proxy URL. Omit if running on Visualforce or
         *                  Cordova etc
         * @param authCallback Callback method to perform authentication when 401 is received.
         * @constructor
         */
        forcetk.Client = function (clientId, loginUrl, proxyUrl, authCallback) {
            this.clientId = clientId;
            this.loginUrl = loginUrl || 'https://login.salesforce.com/';
            if (typeof proxyUrl === 'undefined' || proxyUrl === null) {
                this.proxyUrl = null;
                this.authzHeader = "Authorization";
            } else {
                // On an external proxy service
                this.proxyUrl = proxyUrl;
                this.authzHeader = "X-Authorization";
            }
            this.refreshToken = null;
            this.sessionId = null;
            this.apiVersion = null;
            this.instanceUrl = null;
            this.asyncAjax = true;
            this.userAgentString = this.computeWebAppSdkAgent(navigator.userAgent);
            this.authCallback = authCallback;
        }

        /**
        * Set a User-Agent to use in the client.
        * @param uaString A User-Agent string to use for all requests.
        */
        forcetk.Client.prototype.setUserAgentString = function (uaString) {
            this.userAgentString = uaString;
        }

        /**
        * Get User-Agent used by this client.
        */
        forcetk.Client.prototype.getUserAgentString = function () {
            return this.userAgentString;
        }


        /**
        * Compute SalesforceMobileSDK for web app
        */
        forcetk.Client.prototype.computeWebAppSdkAgent = function (navigatorUserAgent) {
            var sdkVersion = SALESFORCE_MOBILE_SDK_VERSION;
            var model = "Unknown"
            var platform = "Unknown";
            var platformVersion = "Unknown";
            var appName = window.location.pathname.split("/").pop();
            var appVersion = "1.0";

            var getIPadVersion = function () {
                var match = /CPU OS ([0-9_]*) like Mac OS X/.exec(navigatorUserAgent);
                return (match != null && match.length == 2 ? match[1].replace(/_/g, ".") : "Unknown");
            };

            var getIPhoneVersion = function () {
                var match = /CPU iPhone OS ([0-9_]*) like Mac OS X/.exec(navigatorUserAgent);
                return (match != null && match.length == 2 ? match[1].replace(/_/g, ".") : "Unknown");
            };

            var getIOSModel = function () {
                var match = /(iPad|iPhone|iPod)/.exec(navigatorUserAgent);
                return (match != null && match.length == 2 ? match[1] : "Unknown");
            };

            var getAndroidVersion = function () {
                var match = /Android ([0-9\.]*)/.exec(navigatorUserAgent);
                return (match != null && match.length == 2 ? match[1] : "Unknown");
            };

            var getAndroidModel = function () {
                var match = /Android[^\)]*; ([^;\)]*)/.exec(navigatorUserAgent);
                return (match != null && match.length == 2 ? match[1].replace(/[\/ ]/g, "_") : "Unknown");
            };

            var getWindowsPhoneVersion = function () {
                var match = /Windows Phone OS ([0-9\.]*)/.exec(navigatorUserAgent);
                return (match != null && match.length == 2 ? match[1] : "Unknown");
            };

            var getWindowsPhoneModel = function () {
                var match = /Windows Phone OS [^\)]*; ([^;\)]*)/.exec(navigatorUserAgent);
                return (match != null && match.length == 2 ? match[1].replace(/[\/ ]/g, "_") : "Unknown");
            };

            var getMacOSVersion = function () {
                var match = /Mac OS X ([0-9_]*)/.exec(navigatorUserAgent);
                return (match != null && match.length == 2 ? match[1].replace(/_/g, ".") : "Unknown");
            };

            var getWindowsVersion = function () {
                var match = /Windows NT ([0-9\.]*)/.exec(navigatorUserAgent);
                return (match != null && match.length == 2 ? match[1] : "Unknown");
            };

            var match = /(iPhone|iPad|iPod|Android|Windows Phone|Macintosh|Windows)/.exec(navigatorUserAgent);
            if (match != null && match.length == 2) {
                switch (match[1]) {
                    case "iPad":
                        platform = "iPhone OS";
                        platformVersion = getIPadVersion();
                        model = "iPad";
                        break;

                    case "iPhone":
                    case "iPod":
                        platform = "iPhone OS";
                        platformVersion = getIPhoneVersion();
                        model = match[1];
                        break;

                    case "Android":
                        platform = "android mobile";
                        platformVersion = getAndroidVersion();
                        model = getAndroidModel();
                        break;

                    case "Windows Phone":
                        platform = "Windows Phone";
                        platformVersion = getWindowsPhoneVersion();
                        model = getWindowsPhoneModel();
                        break;

                    case "Macintosh":
                        platform = "Mac OS";
                        platformVersion = getMacOSVersion();
                        break;

                    case "Windows":
                        platform = "Windows";
                        platformVersion = getWindowsVersion();
                        break;
                }
            }

            return "SalesforceMobileSDK/" + sdkVersion + " " + platform + "/" + platformVersion + " (" + model + ") " + appName + "/" + appVersion + " Web " + navigatorUserAgent;
        }

        /**
         * Set a refresh token in the client.
         * @param refreshToken an OAuth refresh token
         */
        forcetk.Client.prototype.setRefreshToken = function (refreshToken) {
            this.refreshToken = refreshToken;
        }

        /**
         * Refresh the access token.
         * @param callback function to call on success
         * @param error function to call on failure
         */
        forcetk.Client.prototype.refreshAccessToken = function (callback, error) {
            var that = this;
            if (typeof this.authCallback === 'undefined' || this.authCallback === null) {
                if (this.refreshToken) {
                    var url = this.loginUrl + '/services/oauth2/token';
                    return $j.ajax({
                        type: 'POST',
                        url: (this.proxyUrl !== null) ? this.proxyUrl : url,
                        cache: false,
                        processData: false,
                        data: 'grant_type=refresh_token&client_id=' + this.clientId + '&refresh_token=' + this.refreshToken,
                        success: function (response) {
                            that.setSessionToken(response.access_token, null, response.instance_url);
                            callback();
                        },
                        error: error,
                        dataType: "json",
                        beforeSend: function (xhr) {
                            if (that.proxyUrl !== null) {
                                xhr.setRequestHeader('SalesforceProxy-Endpoint', url);
                            }
                        }
                    });
                } else {
                    if (typeof error === 'function') {
                        error();
                    }
                }
            } else {
                this.authCallback(that, callback, error);
            }
        }

        /**
         * Set a session token and the associated metadata in the client.
         * @param sessionId a salesforce.com session ID. In a Visualforce page,
         *                   use '{!$Api.sessionId}' to obtain a session ID.
         * @param [apiVersion="33.0"] Force.com API version
         * @param [instanceUrl] Omit this if running on Visualforce; otherwise
         *                   use the value from the OAuth token.
         */
        forcetk.Client.prototype.setSessionToken = function (sessionId, apiVersion, instanceUrl) {
            this.sessionId = sessionId;
            this.apiVersion = (typeof apiVersion === 'undefined' || apiVersion === null) ? 'v33.0' : apiVersion;
            // In PhoneGap OR outside
            if (location.protocol === 'ms-appx:' || location.protocol === 'ms-appx-web:' || location.protocol === 'file:' || this.proxyUrl != null) {
                this.instanceUrl = instanceUrl;
            }
                // In Visualforce
            else {
                this.instanceUrl = location.protocol + "//" + location.hostname;
            }
        }

        // Internal method to generate the key/value pairs of all the required headers for xhr.
        var getRequestHeaders = function (client) {
            var headers = {};

            headers[client.authzHeader] = "Bearer " + client.sessionId;
            headers['Cache-Control'] = 'no-store';
            // See http://www.salesforce.com/us/developer/docs/chatterapi/Content/intro_requesting_bearer_token_url.htm#kanchor36
            headers["X-Connect-Bearer-Urls"] = true;
            if (client.userAgentString !== null) {
                headers['X-User-Agent'] = client.userAgentString;
            }
            return headers;
        }

        /*
         * Low level utility function to call the Salesforce endpoint.
         * @param path resource path relative to /services/data or fully qualified url (to Salesforce)
         * @param callback function to which response will be passed
         * @param [error=null] function to which jqXHR will be passed in case of error
         * @param [method="GET"] HTTP method for call
         * @param [payload=null] payload for POST/PATCH etc
         * @param [headerParams={headerName:"headerValue",...}] parameters to send as header values for POST/PATCH etc
         */
        var ajaxRequestId = 0;
        forcetk.Client.prototype.ajax = function (path, callback, error, method, payload, headerParams) {
            var tag = "";
            var that = this;
            var retryCount = 0;
            var url = (path.indexOf(this.instanceUrl) == 0 ? path : this.instanceUrl + (path.indexOf('/services/data') == 0 ? path : '/services/data' + path));
            return $j.ajax({
                type: method || "GET",
                async: this.asyncAjax,
                url: (this.proxyUrl !== null) ? this.proxyUrl : url,
                contentType: method == "DELETE" || method == "GET" ? null : 'application/json',
                cache: false,
                processData: false,
                dataType: "json",
                data: payload,
                headers: getRequestHeaders(this),
                success: function () {
                    console.timeEnd(tag);
                    callback.apply(null, arguments);
                },
                error: function (jqXHR, textStatus, errorThrown) {
                    console.timeEnd(tag);
                    var xhr = this;
                    var errorCallback = function () {
                        if (typeof error == 'function') {
                            error(jqXHR, textStatus, errorThrown);
                        }
                    }
                    if (jqXHR.status === 401 && retryCount++ == 0) {
                        that.refreshAccessToken(function () {
                            that.replay(xhr);
                        },
                        errorCallback);
                    } else errorCallback();
                },
                beforeSend: function (xhr) {
                    // Timing
                    ajaxRequestId++;
                    var a = document.createElement("a");
                    a.href = url;
                    tag = "TIMING " + a.pathname + "(#" + ajaxRequestId + ")";
                    console.time(tag);

                    if (that.proxyUrl !== null) {
                        xhr.setRequestHeader('SalesforceProxy-Endpoint', url);
                    }
                    //Add any custom headers
                    for (paramName in (headerParams || {})) {
                        xhr.setRequestHeader(paramName, headerParams[paramName]);
                    }
                }
            });
        }

        /*
         * Low level utility function to replay an ajax request.
         * The utility function updates the session id before replaying the request.
         * @param xhr xhr request to be replayed.
         */
        forcetk.Client.prototype.replay = function (xhr) {
            xhr.headers = getRequestHeaders(this);
            $j.ajax(xhr);
        }

        /**
         * Utility function to query the Chatter API and download a file
         * Note, raw XMLHttpRequest because JQuery mangles the arraybuffer
         * This should work on any browser that supports XMLHttpRequest 2 because arraybuffer is required.
         * For mobile, that means iOS >= 5 and Android >= Honeycomb
         * @author Tom Gersic
         * @param path resource path relative to /services/data
         * @param mimetype of the file
         * @param callback function to which response will be passed
         * @param [error=null] function to which request will be passed in case of error
         * @param retry true if we've already tried refresh token flow once
         **/
        forcetk.Client.prototype.getChatterFile = function (path, mimeType, callback, error, retry) {
            var that = this;
            var url = this.instanceUrl + '/services/data' + path;
            var request = new XMLHttpRequest();
            request.open("GET", (this.proxyUrl !== null) ? this.proxyUrl : url, true);
            request.responseType = "arraybuffer";
            request.setRequestHeader(that.authzHeader, "Bearer " + that.sessionId);
            if (that.userAgentString !== null) {
                request.setRequestHeader('User-Agent', that.userAgentString);
                request.setRequestHeader('X-User-Agent', that.userAgentString);
            }
            if (this.proxyUrl !== null) {
                request.setRequestHeader('SalesforceProxy-Endpoint', url);
            }
            request.setRequestHeader('Cache-Control', 'no-store');
            request.onreadystatechange = function () {
                // continue if the process is completed
                if (request.readyState == 4) {
                    // continue only if HTTP status is "OK"
                    if (request.status == 200) {
                        try {
                            // retrieve the response
                            callback(request.response);
                        } catch (e) {
                            // display error message
                            alert("Error reading the response: " + e.toString());
                        }
                    }
                        //refresh token in 401
                    else if (request.status == 401 && !retry) {
                        that.refreshAccessToken(function () {
                            that.getChatterFile(path, mimeType, callback, error, true);
                        },
                        error);
                    } else {
                        // display status message
                        error(request, request.statusText, request.response);
                    }
                }
            }
            request.send();
        }

        /*
         * Low level utility function to call the Salesforce endpoint specific for Apex REST API.
         * @param path resource path relative to /services/apexrest
         * @param [method="GET"] HTTP method for call
         * @param [payload=null] payload for POST/PATCH etc
         * @param [headerParams={headerName:"headerValue",...}] parameters to send as header values for POST/PATCH etc
         * @param callback function to which response will be passed
         * @param [error=null] function to which jqXHR will be passed in case of error
         */
        forcetk.Client.prototype.apexrest = function (path, method, payload, headerParams, callback, error) {
            return this.ajax(this.instanceUrl + '/services/apexrest' + path, callback, error, method, payload, headerParams);
        }

        /*
         * Lists summary information about each Salesforce.com version currently
         * available, including the version, label, and a link to each version's
         * root.
         * @param callback function to which response will be passed
         * @param [error=null] function to which jqXHR will be passed in case of error
         */
        forcetk.Client.prototype.versions = function (callback, error) {
            return this.ajax('/', callback, error);
        }

        /*
         * Lists available resources for the client's API version, including
         * resource name and URI.
         * @param callback function to which response will be passed
         * @param [error=null] function to which jqXHR will be passed in case of error
         */
        forcetk.Client.prototype.resources = function (callback, error) {
            return this.ajax('/' + this.apiVersion + '/', callback, error);
        }

        /*
         * Lists the available objects and their metadata for your organization's
         * data.
         * @param callback function to which response will be passed
         * @param [error=null] function to which jqXHR will be passed in case of error
         */
        forcetk.Client.prototype.describeGlobal = function (callback, error) {
            return this.ajax('/' + this.apiVersion + '/sobjects/', callback, error);
        }

        /*
         * Describes the individual metadata for the specified object.
         * @param objtype object type; e.g. "Account"
         * @param callback function to which response will be passed
         * @param [error=null] function to which jqXHR will be passed in case of error
         */
        forcetk.Client.prototype.metadata = function (objtype, callback, error) {
            return this.ajax('/' + this.apiVersion + '/sobjects/' + objtype + '/'
            , callback, error);
        }

        /*
         * Completely describes the individual metadata at all levels for the
         * specified object.
         * @param objtype object type; e.g. "Account"
         * @param callback function to which response will be passed
         * @param [error=null] function to which jqXHR will be passed in case of error
         */
        forcetk.Client.prototype.describe = function (objtype, callback, error) {
            return this.ajax('/' + this.apiVersion + '/sobjects/' + objtype
            + '/describe/', callback, error);
        }

        /*
         * Fetches the layout configuration for a particular sobject type and record type id.
         * @param objtype object type; e.g. "Account"
         * @param (Optional) recordTypeId Id of the layout's associated record type
         * @param callback function to which response will be passed
         * @param [error=null] function to which jqXHR will be passed in case of error
         */
        forcetk.Client.prototype.describeLayout = function (objtype, recordTypeId, callback, error) {
            recordTypeId = recordTypeId ? recordTypeId : '';
            return this.ajax('/' + this.apiVersion + '/sobjects/' + objtype
            + '/describe/layouts/' + recordTypeId, callback, error);
        }

        /*
         * Creates a new record of the given type.
         * @param objtype object type; e.g. "Account"
         * @param fields an object containing initial field names and values for
         *               the record, e.g. {:Name "salesforce.com", :TickerSymbol
         *               "CRM"}
         * @param callback function to which response will be passed
         * @param [error=null] function to which jqXHR will be passed in case of error
         */
        forcetk.Client.prototype.create = function (objtype, fields, callback, error) {
            return this.ajax('/' + this.apiVersion + '/sobjects/' + objtype + '/'
            , callback, error, "POST", JSON.stringify(fields));
        }

        /*
         * Retrieves field values for a record of the given type.
         * @param objtype object type; e.g. "Account"
         * @param id the record's object ID
         * @param [fields=null] optional comma-separated list of fields for which
         *               to return values; e.g. Name,Industry,TickerSymbol
         * @param callback function to which response will be passed
         * @param [error=null] function to which jqXHR will be passed in case of error
         */
        forcetk.Client.prototype.retrieve = function (objtype, id, fieldlist, callback, error) {
            if (arguments.length == 4) {
                error = callback;
                callback = fieldlist;
                fieldlist = null;
            }
            var fields = fieldlist ? '?fields=' + fieldlist : '';
            return this.ajax('/' + this.apiVersion + '/sobjects/' + objtype + '/' + id
            + fields, callback, error);
        }

        /*
         * Upsert - creates or updates record of the given type, based on the
         * given external Id.
         * @param objtype object type; e.g. "Account"
         * @param externalIdField external ID field name; e.g. "accountMaster__c"
         * @param externalId the record's external ID value
         * @param fields an object containing field names and values for
         *               the record, e.g. {:Name "salesforce.com", :TickerSymbol
         *               "CRM"}
         * @param callback function to which response will be passed
         * @param [error=null] function to which jqXHR will be passed in case of error
         */
        forcetk.Client.prototype.upsert = function (objtype, externalIdField, externalId, fields, callback, error) {
            return this.ajax('/' + this.apiVersion + '/sobjects/' + objtype + '/' + externalIdField + '/' + externalId
            + '?_HttpMethod=PATCH', callback, error, "POST", JSON.stringify(fields));
        }

        /*
         * Updates field values on a record of the given type.
         * @param objtype object type; e.g. "Account"
         * @param id the record's object ID
         * @param fields an object containing initial field names and values for
         *               the record, e.g. {:Name "salesforce.com", :TickerSymbol
         *               "CRM"}
         * @param callback function to which response will be passed
         * @param [error=null] function to which jqXHR will be passed in case of error
         */
        forcetk.Client.prototype.update = function (objtype, id, fields, callback, error) {
            return this.ajax('/' + this.apiVersion + '/sobjects/' + objtype + '/' + id
            + '?_HttpMethod=PATCH', callback, error, "POST", JSON.stringify(fields));
        }

        /*
         * Deletes a record of the given type. Unfortunately, 'delete' is a
         * reserved word in JavaScript.
         * @param objtype object type; e.g. "Account"
         * @param id the record's object ID
         * @param callback function to which response will be passed
         * @param [error=null] function to which jqXHR will be passed in case of error
         */
        forcetk.Client.prototype.del = function (objtype, id, callback, error) {
            return this.ajax('/' + this.apiVersion + '/sobjects/' + objtype + '/' + id
            , callback, error, "DELETE");
        }

        /*
         * Executes the specified SOQL query.
         * @param soql a string containing the query to execute - e.g. "SELECT Id,
         *             Name from Account ORDER BY Name LIMIT 20"
         * @param callback function to which response will be passed
         * @param [error=null] function to which jqXHR will be passed in case of error
         */
        forcetk.Client.prototype.query = function (soql, callback, error) {
            return this.ajax('/' + this.apiVersion + '/query?q=' + encodeURI(soql)
            , callback, error);
        }

        /*
         * Queries the next set of records based on pagination.
         * <p>This should be used if performing a query that retrieves more than can be returned
         * in accordance with http://www.salesforce.com/us/developer/docs/api_rest/Content/dome_query.htm</p>
         * <p>Ex: forcetkClient.queryMore( successResponse.nextRecordsUrl, successHandler, failureHandler )</p>
         *
         * @param url - the url retrieved from nextRecordsUrl or prevRecordsUrl
         * @param callback function to which response will be passed
         * @param [error=null] function to which jqXHR will be passed in case of error
         */
        forcetk.Client.prototype.queryMore = function (url, callback, error) {
            return this.ajax(url, callback, error);
        }

        /*
         * Executes the specified SOSL search.
         * @param sosl a string containing the search to execute - e.g. "FIND
         *             {needle}"
         * @param callback function to which response will be passed
         * @param [error=null] function to which jqXHR will be passed in case of error
         */
        forcetk.Client.prototype.search = function (sosl, callback, error) {
            return this.ajax('/' + this.apiVersion + '/search?q=' + encodeURI(sosl)
            , callback, error);
        }

        /*
         * Returns a page from the list of files owned by the specified user
         * @param userId a user id or 'me' - when null uses current user
         * @param page page number - when null fetches first page
         * @param callback function to which response will be passed
         * @param [error=null] function to which jqXHR will be passed in case of error
         */
        forcetk.Client.prototype.ownedFilesList = function (userId, page, callback, error) {
            return this.ajax('/' + this.apiVersion + '/chatter/users/' + (userId == null ? 'me' : userId) + '/files' + (page != null ? '?page=' + page : '')
            , callback, error);
        }

        /*
         * Returns a page from the list of files from groups that the specified user is a member of
         * @param userId a user id or 'me' - when null uses current user
         * @param page page number - when null fetches first page
         * @param callback function to which response will be passed
         * @param [error=null] function to which jqXHR will be passed in case of error
         */
        forcetk.Client.prototype.filesInUsersGroups = function (userId, page, callback, error) {
            return this.ajax('/' + this.apiVersion + '/chatter/users/' + (userId == null ? 'me' : userId) + '/files/filter/groups' + (page != null ? '?page=' + page : '')
            , callback, error);
        }

        /*
         * Returns a page from the list of files shared with the specified user
         * @param userId a user id or 'me' - when null uses current user
         * @param page page number - when null fetches first page
         * @param callback function to which response will be passed
         * @param [error=null] function to which jqXHR will be passed in case of error
         */
        forcetk.Client.prototype.filesSharedWithUser = function (userId, page, callback, error) {
            return this.ajax('/' + this.apiVersion + '/chatter/users/' + (userId == null ? 'me' : userId) + '/files/filter/sharedwithme' + (page != null ? '?page=' + page : '')
            , callback, error);
        }

        /*
         * Returns file details
         * @param fileId file's Id
         * @param version - when null fetches details of most recent version
         * @param callback function to which response will be passed
         * @param [error=null] function to which jqXHR will be passed in case of error
         */
        forcetk.Client.prototype.fileDetails = function (fileId, version, callback, error) {
            return this.ajax('/' + this.apiVersion + '/chatter/files/' + fileId + (version != null ? '?versionNumber=' + version : '')
            , callback, error);
        }

        /*
         * Returns file details for multiple files
         * @param fileIds file ids
         * @param callback function to which response will be passed
         * @param [error=null] function to which jqXHR will be passed in case of error
         */
        forcetk.Client.prototype.batchFileDetails = function (fileIds, callback, error) {
            return this.ajax('/' + this.apiVersion + '/chatter/files/batch/' + fileIds.join(',')
            , callback, error);
        }

        /*
         * Returns file rendition
         * @param fileId file's Id
         * @param version - when null fetches details of most recent version
         * @param rentidionType - FLASH, PDF, THUMB120BY90, THUMB240BY180, THUMB720BY480
         * @param page page number - when null fetches first page
         * @param callback function to which response will be passed
         * @param [error=null] function to which jqXHR will be passed in case of error
         */
        forcetk.Client.prototype.fileRendition = function (fileId, version, renditionType, page, callback, error) {
            var mimeType = (renditionType == "FLASH" ? "application/x-shockwave-flash" : (renditionType == "PDF" ? "application/pdf" : "image/jpeg"));
            return this.getChatterFile(this.fileRenditionPath(fileId, version, renditionType, page)
                                       , mimeType, callback, error);
        }

        /*
         * Returns file rendition path (relative to service/data) - from html (e.g. img tag), use the bearer token url instead
         * @param fileId file's Id
         * @param version - when null fetches details of most recent version
         * @param rentidionType - FLASH, PDF, THUMB120BY90, THUMB240BY180, THUMB720BY480
         * @param page page number - when null fetches first page
         */
        forcetk.Client.prototype.fileRenditionPath = function (fileId, version, renditionType, page) {
            return '/' + this.apiVersion + '/chatter/files/' + fileId + '/rendition?type=' + renditionType + (version != null ? '&versionNumber=' + version : '') + (page != null ? '&page=' + page : '');
        }

        /*
         * Returns file content
         * @param fileId file's Id
         * @param version - when null fetches details of most recent version
         * @param callback function to which response will be passed
         * @param [error=null] function to which jqXHR will be passed in case of error
         */
        forcetk.Client.prototype.fileContents = function (fileId, version, callback, error) {
            var mimeType = null; // we don't know
            return this.getChatterFile(this.fileContentsPath(fileId, version)
                                       , mimeType, callback, error);
        }

        /*
         * Returns file content path (relative to service/data) - from html (e.g. img tag), use the bearer token url instead
         * @param fileId file's Id
         * @param version - when null fetches details of most recent version
         */
        forcetk.Client.prototype.fileContentsPath = function (fileId, version) {
            return '/' + this.apiVersion + '/chatter/files/' + fileId + '/content' + (version != null ? '?versionNumber=' + version : '');
        }


        /**
         * Returns a page from the list of entities that this file is shared to
         *
         * @param fileId file's Id
         * @param page page number - when null fetches first page
         * @param callback function to which response will be passed
         * @param [error=null] function to which jqXHR will be passed in case of error
         */
        forcetk.Client.prototype.fileShares = function (fileId, page, callback, error) {
            return this.ajax('/' + this.apiVersion + '/chatter/files/' + fileId + '/file-shares' + (page != null ? '?page=' + page : '')
            , callback, error);
        }

        /**
         * Adds a file share for the specified fileId to the specified entityId
         *
         * @param fileId file's Id
         * @param entityId Id of the entity to share the file to (e.g. a user or a group)
         * @param shareType the type of share (V - View, C - Collaboration)
         * @param callback function to which response will be passed
         * @param [error=null] function to which jqXHR will be passed in case of error
         */
        forcetk.Client.prototype.addFileShare = function (fileId, entityId, shareType, callback, error) {
            return this.create("ContentDocumentLink", { ContentDocumentId: fileId, LinkedEntityId: entityId, ShareType: shareType }, callback, error);
        }

        /**
         * Deletes the specified file share.
         * @param shareId Id of the file share record (aka ContentDocumentLink)
         * @param callback function to which response will be passed
         * @param [error=null] function to which jqXHR will be passed in case of error
         */
        forcetk.Client.prototype.deleteFileShare = function (sharedId, callback, error) {
            return this.del("ContentDocumentLink", sharedId, callback, error);
        }
    }
})
.call(this, jQuery);
