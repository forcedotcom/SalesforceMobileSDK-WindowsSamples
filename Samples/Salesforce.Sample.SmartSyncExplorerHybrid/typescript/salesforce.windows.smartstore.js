/*
* Copyright (c) 2015-present, salesforce.com, inc.
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
/// <reference path="../typings/WinJS-3.0.d.ts"/>
/// <reference path="../typings/Salesforce.SDK.Hybrid.SmartStore.d.ts"/>
/// <reference path="../typings/winrt.d.ts"/>
var SmartStoreJS;
(function (SmartStoreJS) {
    var SoupIndexSpec = (function () {
        function SoupIndexSpec(p, t) {
            this.path = p;
            this.type = t;
        }
        return SoupIndexSpec;
    }());
    SmartStoreJS.SoupIndexSpec = SoupIndexSpec;
    var QuerySpec = (function () {
        function QuerySpec(s, p, q, m, l, b, e, sql, o, psize) {
            // Returns a query spec that will page all entries matching the given likeKey value for path
            this.buildLikeQuerySpec = function (soupName, path, likeKey, order, pageSize) {
                var inst = new QuerySpec(soupName, path, "like", null, likeKey, null, null, null, order, pageSize);
                return inst;
            };
            // the kind of query, one of: "exact","range", "like" or "smart":
            // "exact" uses matchKey, "range" uses beginKey and endKey, "like" uses likeKey, "smart" uses smartSql
            this.queryType = q;
            //path for the original IndexSpec you wish to use for search: may be a compound path eg Account.Owner.Name
            this.path = p;
            //for queryType "exact"
            this.matchKey = m;
            //for queryType "like"
            this.likeKey = l;
            //for queryType "range"
            //the value at which query results may begin
            this.beginKey = b;
            //the value at which query results may end
            this.endKey = e;
            // for queryType "smart"
            this.smartSql = sql;
            //"ascending" or "descending" : optional
            if (o)
                this.order = o;
            else
                this.order = "ascending";
            //the number of entries to copy from native to javascript per each cursor page
            if (psize)
                this.pageSize = psize;
            else
                this.pageSize = 10;
            this.soupName = s;
        }
        // Returns a query spec that will page through all soup entries in order by the given path value
        // Internally it simply does a range query with null begin and end keys
        QuerySpec.prototype.buildAllQuerySpec = function (soupName, path, order, pageSize) {
            var inst = new QuerySpec(soupName, path, "range", null, null, null, null, null, order, pageSize);
            return inst;
        };
        // Returns a query spec that will page all entries exactly matching the matchKey value for path
        QuerySpec.prototype.buildExactQuerySpec = function (soupName, path, matchKey, pageSize) {
            var inst = new QuerySpec(soupName, path, "exact", matchKey, null, null, null, null, null, pageSize);
            return inst;
        };
        // Returns a query spec that will page all entries in the range beginKey ...endKey for path
        QuerySpec.prototype.buildRangeQuerySpec = function (soupName, path, beginKey, endKey, order, pageSize) {
            var inst = new QuerySpec(soupName, path, "range", null, null, beginKey, endKey, null, order, pageSize);
            return inst;
        };
        // Returns a query spec that will page all results returned by smartSql
        QuerySpec.prototype.buildSmartQuerySpec = function (smartSql, pageSize) {
            var inst = new QuerySpec(null, null, "smart", null, null, null, null, smartSql, null, pageSize);
            return inst;
        };
        return QuerySpec;
    }());
    SmartStoreJS.QuerySpec = QuerySpec;
    var StoreCursor = (function () {
        function StoreCursor() {
            this.logger = new Logger();
            this.smartStore = new SmartStore();
            //a unique identifier for this cursor, used by plugin
            this.cursorId = null;
            //the maximum number of entries returned per page 
            this.pageSize = 0;
            // the total number of results
            this.totalEntries = 0;
            //the total number of pages of results available
            this.totalPages = 0;
            //the current page index among all the pages available
            this.currentPageIndex = 0;
            //the list of current page entries, ordered as requested in the querySpec
            this.currentPageOrderedEntries = null;
        }
        StoreCursor.prototype.moveCursorToPageIndex = function (successCB, errorCB, args) {
            var cursor = args[1];
            this.logger.storeConsole["debug"] = "moveCursorToPageIndex:isGlobalStore=" + cursor.isGlobalStore + ",cursorId=" + cursor.cursorId + ",newPageIndex=" + cursor.newPageIndex;
            var sm = this.smartStore.getSmartStore(cursor.isGlobalStore);
            if (!sm) {
                errorCB("No active account");
            }
            else {
                successCB(sm.moveCursorToPageIndex(cursor.cursorId, cursor.pageIndex));
            }
        };
        StoreCursor.prototype.moveCursorToNextPage = function (successCB, errorCB, args) {
            var cursor = args[1];
            var newPageIndex = cursor.currentPageIndex + 1;
            if (newPageIndex >= cursor.totalPages) {
                errorCB(cursor, new Error("moveCursorToNextPage called while on last page"));
            }
            else {
                this.moveCursorToPageIndex(successCB, errorCB, [cursor.isGlobalStore, cursor, newPageIndex]);
            }
        };
        StoreCursor.prototype.moveCursorToPreviousPage = function (successCB, errorCB, args) {
            var cursor = args[1];
            var newPageIndex = cursor.currentPageIndex - 1;
            if (newPageIndex < 0) {
                errorCB(cursor, new Error("moveCursorToPreviousPage called while on first page"));
            }
            else {
                var sm = this.smartStore.getSmartStore(cursor.isGlobalStore);
                if (!sm) {
                    errorCB("No active account");
                }
                else {
                    successCB(sm.moveCursorToPageIndex(cursor.cursorId, cursor.numberIndex));
                }
            }
        };
        StoreCursor.prototype.closeCursor = function (successCB, errorCB, args) {
            var cursor = args[1];
            this.logger.storeConsole["debug"] = "closeCursor:isGlobalStore=" + cursor.isGlobalStore + ",cursorId=" + cursor.cursorId;
            var sm = this.smartStore.getSmartStore(cursor.isGlobalStore);
            if (!sm) {
                errorCB("No active account");
            }
            else {
                if (typeof cursor.cursorId == 'undefined')
                    successCB();
                else
                    successCB(sm.closeCursor(cursor.cursorId));
            }
        };
        return StoreCursor;
    }());
    SmartStoreJS.StoreCursor = StoreCursor;
    var Logger = (function () {
        function Logger() {
        }
        Logger.prototype.setLogLevel = function (level) {
            this.logLevel = level;
            var methods = ["error", "info", "warn", "debug"];
            var levelAsInt = methods.indexOf(level.toLowerCase());
            for (var i = 0; i < methods.length; i++) {
                this.storeConsole[methods[i]] = (i <= levelAsInt ? console[methods[i]].bind(console) : function () { });
            }
        };
        Logger.prototype.getLogLevel = function () {
            return this.logLevel;
        };
        return Logger;
    }());
    SmartStoreJS.Logger = Logger;
    var SmartStore = (function () {
        function SmartStore() {
            this.smartStore = Salesforce.SDK.Hybrid.SmartStore;
            this.logger = new Logger();
            // Helper function to handle calls that don't specify isGlobalStore as first argument
            // If missing, the caller is re-invoked with false prepended to the arguments list and true is returned
            // Otherwise, false is returned
            this.checkFirstArg = function (argumentsOfCaller) {
                // Turning arguments into array
                var args = Array.prototype.slice.call(argumentsOfCaller);
                // If first argument is not a boolean
                if (typeof (args[0]) !== "boolean") {
                    // Pre-pending false
                    args.unshift(false);
                    // Re-invoking function
                    argumentsOfCaller.callee.apply(null, args);
                    return true;
                }
                else {
                    return false;
                }
            };
            this.clearSoup = function (successCB, errorCB, args) {
                console.log("SmartStore.clearSoup:soupName=" + args[0]);
                var sm = this.getSmartStore(false);
                if (!sm) {
                    errorCB("No active account");
                }
                else {
                    sm.clearSoup(args[0]);
                    successCB("Soup" + args[0] + "is cleared successfully");
                }
            };
        }
        SmartStore.prototype.getSmartStore = function (isGlobalStore) {
            var sm = null;
            if (isGlobalStore) {
                sm = this.smartStore.SmartStore.getGlobalSmartStore();
            }
            else {
                sm = this.smartStore.SmartStore.getSmartStore();
            }
            return sm;
        };
        SmartStore.prototype.getDatabaseSize = function (successCB, errorCB, args) {
            errorCB("not supported");
        };
        SmartStore.prototype.registerSoup = function (successCB, errorCB, args) {
            var specs = JSON.stringify(args[1]);
            console.log("SmartStore.registerSoup:soupName=" + args[0] + ",indexSpecs=" + specs);
            var sm = this.getSmartStore(false);
            if (!sm) {
                errorCB("No active account");
            }
            else {
                var indexspecs = IndexSpec.jsonToIndexSpecCollection(specs);
                sm.registerSoup(args[0], indexspecs);
                successCB();
            }
        };
        SmartStore.prototype.removeSoup = function (successCB, errorCB, args) {
            console.log("SmartStore.removeSoup:soupName=" + args[0]);
            var sm = this.getSmartStore(false);
            if (!sm) {
                errorCB("No active account");
            }
            else {
                sm.dropSoup(args[0]);
                successCB();
            }
        };
        SmartStore.prototype.getSoupIndexSpecs = function (successCB, errorCB, args) {
            console.log("SmartStore.getSoupIndexSpecs:soupName=" + args[0]);
            var sm = this.getSmartStore(false);
            if (!sm) {
                errorCB("No active account");
            }
            else {
                var specs = sm.getSoupIndexSpecsSerialized(args[0]);
                successCB(specs);
            }
        };
        SmartStore.prototype.alterSoup = function (successCB, errorCB, args) {
            errorCB("Not supported");
        };
        SmartStore.prototype.reIndexSoup = function (successCB, errorCB, args) {
            errorCB("Not supported");
        };
        SmartStore.prototype.soupExists = function (successCB, errorCB, args) {
            console.log("SmartStore.soupExists:soupName=" + args[0]);
            var sm = this.getSmartStore(false);
            if (!sm) {
                errorCB("No active account");
            }
            else {
                successCB(sm.hasSoup(args[0]));
            }
        };
        SmartStore.prototype.querySoup = function (successCB, errorCB, args) {
            var spec = args[0];
            if (spec.queryType == "smart")
                throw new Error("Smart queries can only be run using runSmartQuery");
            console.log("SmartStore.querySoup:soupName=" + spec.soupName + ",indexPath=" + spec.indexPath);
            var sm = this.getSmartStore(false);
            if (!sm) {
                errorCB("No active account");
            }
            else {
                var qs;
                switch (spec.queryType) {
                    case "exact":
                        qs = this.smartStore.QuerySpec.buildExactQuerySpec(spec.soupName, spec.path, spec.exactMatchKey, spec.pageSize);
                        break;
                    case "like":
                        qs = this.smartStore.QuerySpec.buildLikeQuerySpec(spec.soupName, spec.path, spec.likeKey, spec.order, spec.pageSize);
                        break;
                    case "range":
                        qs = this.smartStore.QuerySpec.buildRangeQuerySpec(spec.soupName, spec.path, spec.beginKey, spec.endKey, spec.order, spec.pageSize);
                        break;
                    default:
                        qs = this.smartStore.QuerySpec.buildSmartQuerySpec(spec.smartSql, spec.pageSize);
                }
                successCB(sm.query(qs, args[1]));
            }
        };
        SmartStore.prototype.runSmartQuery = function (successCB, errorCB, args) {
            console.log("SmartStore.runSmartQuery:soupName=" + args[0].soupName + ",indexPath=" + args[0].path);
            var sm = this.getSmartStore(false);
            if (!sm) {
                errorCB("No active account");
            }
            else {
                var smart = this.smartStore.QuerySpec.buildSmartQuerySpec(args[0].smartSql, args[0].pageSize);
                successCB(sm.query(smart, args[1]));
            }
        };
        SmartStore.prototype.createSoupEntries = function (successCB, errorCB, args) {
            console.log("SmartStore.upsertSoupEntries:soupName=" + args[0] + ",element=" + args[1]);
            var sm = this.getSmartStore(false);
            if (!sm) {
                errorCB("No active account");
            }
            else {
                for (var _i = 0, _a = args[1]; _i < _a.length; _i++) {
                    var record = _a[_i];
                    successCB(sm.create(args[0], JSON.stringify(record)));
                }
            }
        };
        SmartStore.prototype.retrieveSoupEntries = function (successCB, errorCB, args) {
            console.log("SmartStore.soupExists:soupName=" + args[0] + ",entryIds=" + args[1]);
            var sm = this.getSmartStore(false);
            if (!sm) {
                errorCB("No active account");
            }
            else {
                successCB(sm.retrieve(args[0], args[1]));
            }
        };
        SmartStore.prototype.upsertSoupEntries = function (successCB, errorCB, args) {
            args[1].externalIdPath = "_soupEntryId";
            this.upsertSoupEntriesWithExternalId(successCB, errorCB, args);
        };
        SmartStore.prototype.upsertSoupEntriesWithExternalId = function (successCB, errorCB, args) {
            console.log("SmartStore.upsertSoupEntries:soupName=" + args[0] + ",entries=" + args[1] + ",externalIdPath=" + args[1].externalIdPath);
            var sm = this.getSmartStore(false);
            if (!sm) {
                errorCB("No active account");
            }
            else {
                for (var _i = 0, _a = args[1]; _i < _a.length; _i++) {
                    var record = _a[_i];
                    sm.upsert(args[0], JSON.stringify(record), args[1].externalIdPath);
                }
                successCB(args[1]);
            }
        };
        SmartStore.prototype.removeFromSoup = function (successCB, errorCB, args) {
            console.log("SmartStore.removeFromSoup:soupName=" + args[0] + ",entryIds=" + args[1]);
            var sm = this.getSmartStore(false);
            if (!sm) {
                errorCB("No active account");
            }
            else {
                successCB(sm.delete(args[0], args[1], true));
            }
        };
        SmartStore.prototype.lookupSoupEntryId = function (successCB, errorCB, args) {
            console.log("SmartStore.lookupSoupEntryId:soupName=" + args[0] + ",fieldPath=" + args[1] + ",fieldValue=" + args[2]);
            var sm = this.getSmartStore(false);
            if (!sm) {
                errorCB("No active account");
            }
            else {
                successCB(sm.lookupSoupEntryId(args[0], args[1], args[2]));
            }
        };
        SmartStore.prototype.hasSoup = function (successCB, errorCB, args) {
            console.log("SmartStore.hasSoup:soupName=" + args[0]);
            var sm = this.getSmartStore(false);
            if (!sm) {
                errorCB("No active account");
            }
            else {
                successCB(sm.hasSoup(args[0]));
            }
        };
        SmartStore.prototype.currentTimeMillis = function () {
            return this.getSmartStore(false).currentTimeMillis;
        };
        return SmartStore;
    }());
    SmartStoreJS.SmartStore = SmartStore;
    var IndexSpec = (function () {
        function IndexSpec(p, t, c) {
            this.path = p;
            this.type = t;
            this.columnName = c;
        }
        ;
        IndexSpec.jsonToIndexSpecCollection = function (json) {
            return Salesforce.SDK.Hybrid.SmartStore.IndexSpec.jsonToIndexSpecCollection(json);
        };
        return IndexSpec;
    }());
    SmartStoreJS.IndexSpec = IndexSpec;
})(SmartStoreJS || (SmartStoreJS = {}));
//# sourceMappingURL=salesforce.windows.smartstore.js.map