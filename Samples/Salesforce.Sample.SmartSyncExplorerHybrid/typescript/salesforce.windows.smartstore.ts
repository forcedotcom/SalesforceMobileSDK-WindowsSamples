 /*
 * Copyright (c) 2015, salesforce.com, inc.
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

module SmartStoreJS {
    export class SoupIndexSpec {
        path: string;
        type: string;

        constructor(p: string, t: string) {
            this.path = p;
            this.type = t;
        }
    }

    export class QuerySpec {
        path: string;
        queryType: string;
        indexPath: string;
        matchKey: string;
        likeKey: string;
        beginKey: string;
        endKey: string;
        smartSql: string;
        order: string;
        pageSize: number;

        constructor(p: string) {
            // the kind of query, one of: "exact","range", "like" or "smart":
            // "exact" uses matchKey, "range" uses beginKey and endKey, "like" uses likeKey, "smart" uses smartSql
            this.queryType = "exact";

            //path for the original IndexSpec you wish to use for search: may be a compound path eg Account.Owner.Name
            this.indexPath = p;

            //for queryType "exact"
            this.matchKey = null;

            //for queryType "like"
            this.likeKey = null;

            //for queryType "range"
            //the value at which query results may begin
            this.beginKey = null;
            //the value at which query results may end
            this.endKey = null;

            // for queryType "smart"
            this.smartSql = null;

            //"ascending" or "descending" : optional
            this.order = "ascending";

            //the number of entries to copy from native to javascript per each cursor page
            this.pageSize = 10;
        }

        // Returns a query spec that will page through all soup entries in order by the given path value
        // Internally it simply does a range query with null begin and end keys
        public buildAllQuerySpec(path: string, order: string, pageSize: number) {
            let inst = new QuerySpec(path);
            inst.queryType = "range";
            if (order) { inst.order = order; } // override default only if a value was specified
            if (pageSize) { inst.pageSize = pageSize; } // override default only if a value was specified
            return inst;
        }

        // Returns a query spec that will page all entries exactly matching the matchKey value for path
        public buildExactQuerySpec(path: string, matchKey: string, pageSize: number) {
            var inst = new QuerySpec(path);
            inst.matchKey = matchKey;
            if (pageSize) { inst.pageSize = pageSize; } // override default only if a value was specified
            return inst;
        }

        // Returns a query spec that will page all entries in the range beginKey ...endKey for path
        public buildRangeQuerySpec(path: string, beginKey: string, endKey: string, order: string, pageSize: number) {
            var inst = new QuerySpec(path);
            inst.queryType = "range";
            inst.beginKey = beginKey;
            inst.endKey = endKey;
            if (order) { inst.order = order; } // override default only if a value was specified
            if (pageSize) { inst.pageSize = pageSize; } // override default only if a value was specified
            return inst;
        }

        // Returns a query spec that will page all entries matching the given likeKey value for path
        public buildLikeQuerySpec = function (path: string, likeKey: string, order: string, pageSize: number) {
            var inst = new QuerySpec(path);
            inst.queryType = "like";
            inst.likeKey = likeKey;
            if (order) { inst.order = order; } // override default only if a value was specified
            if (pageSize) { inst.pageSize = pageSize; } // override default only if a value was specified
            return inst;
        }

        // Returns a query spec that will page all results returned by smartSql
        public buildSmartQuerySpec(smartSql: string, pageSize: number) {
            var inst = new QuerySpec(null);
            inst.queryType = "smart";
            inst.smartSql = smartSql;
            if (pageSize) { inst.pageSize = pageSize; } // override default only if a value was specified
            return inst;
        }
    }

    export class StoreCursor {
        cursorId: string;
        pageSize: number;
        totalEntries: number;
        totalPages: number;
        currentPageIndex: number;
        currentPageOrderedEntries: string[];

        constructor() {
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

        private logger = new Logger();
        private smartStore = new SmartStore();

        public moveCursorToPageIndex(successCB, errorCB, args) {
            var cursor = args[1];
            this.logger.storeConsole["debug"] = "moveCursorToPageIndex:isGlobalStore=" + cursor.isGlobalStore + ",cursorId=" + cursor.cursorId + ",newPageIndex=" + cursor.newPageIndex;
            var sm = this.smartStore.getSmartStore(cursor.isGlobalStore);
            if (!sm) {
                errorCB("No active account");
            } else {
                successCB(sm.moveCursorToPageIndex(cursor.cursorId, cursor.pageIndex));
            }
        }

        public moveCursorToNextPage(successCB, errorCB, args) {
            var cursor = args[1];
            var newPageIndex = cursor.currentPageIndex + 1;
            if (newPageIndex >= cursor.totalPages) {
                errorCB(cursor, new Error("moveCursorToNextPage called while on last page"));
            } else {
                this.moveCursorToPageIndex(successCB, errorCB, [cursor.isGlobalStore, cursor, newPageIndex]);
            }
        }

        public moveCursorToPreviousPage(successCB, errorCB, args) {
            var cursor = args[1];
            var newPageIndex = cursor.currentPageIndex - 1;
            if (newPageIndex < 0) {
                errorCB(cursor, new Error("moveCursorToPreviousPage called while on first page"));
            } else {
                var sm = this.smartStore.getSmartStore(cursor.isGlobalStore);
                if (!sm) {
                    errorCB("No active account");
                } else {
                    successCB(sm.moveCursorToPageIndex(cursor.cursorId, cursor.numberIndex));
                }
            }
        }

        public closeCursor(successCB, errorCB, args) {
            var cursor = args[1];
            this.logger.storeConsole["debug"] = "closeCursor:isGlobalStore=" + cursor.isGlobalStore + ",cursorId=" + cursor.cursorId;
            var sm = this.smartStore.getSmartStore(cursor.isGlobalStore);
            if (!sm) {
                errorCB("No active account");
            } else {
                if (typeof cursor.cursorId == 'undefined')
                    successCB();
                else
                    successCB(sm.closeCursor(cursor.cursorId));
            }
        }
    }

    export class Logger {
        public logLevel: string;
        public storeConsole: Object;

        constructor() {
            
        }

        public setLogLevel(level: string) {
            this.logLevel = level;
            var methods = ["error", "info", "warn", "debug"];
            var levelAsInt = methods.indexOf(level.toLowerCase());
            for (var i = 0; i < methods.length; i++) {
                this.storeConsole[methods[i]] = (i <= levelAsInt ? console[methods[i]].bind(console) : function () { });
            }
        }

        public getLogLevel() {
            return this.logLevel;
        }   
    }

    export class SmartStore {
        constructor() { }
        private smartStore = Salesforce.SDK.Hybrid.SmartStore;
        private logger = new Logger();

        // Helper function to handle calls that don't specify isGlobalStore as first argument
        // If missing, the caller is re-invoked with false prepended to the arguments list and true is returned
        // Otherwise, false is returned
        public checkFirstArg = function (argumentsOfCaller) {
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
            // First argument is a boolean
            else {
                return false;
            }
        }

        public getSmartStore(isGlobalStore: boolean) {
            
            var sm = null;
            if (isGlobalStore) {
                sm = this.smartStore.SmartStore.getGlobalSmartStore();
            } else {
                sm = this.smartStore.SmartStore.getSmartStore();
            }
            return sm;
        }

        public getDatabaseSize(successCB, errorCB, args) {
            errorCB("not supported");
        }

        public registerSoup(successCB, errorCB, args) {
            var payload = args[1];
            var specs = JSON.stringify(payload.indexes);
            this.logger.storeConsole["debug"] = "SmartStore.registerSoup:isGlobalStore=" + payload.isGlobalStore + ",soupName=" + payload.soupName + ",indexSpecs=" + specs;
            var sm = this.getSmartStore(payload.isGlobalStore);
            if (!sm) {
                errorCB("No active account");
            } else {
                var indexspecs = this.smartStore.IndexSpec.jsonToIndexSpecCollection(specs);
                sm.registerSoup(payload.soupName, indexspecs);
                successCB();
            }
        }

        public removeSoup(successCB, errorCB, args) {
            var payload = args[1];
            var specs = JSON.stringify(payload.indexes);
            this.logger.storeConsole["debug"] = "SmartStore.removeSoup:isGlobalStore=" + payload.isGlobalStore + ",soupName=" + payload.soupName;
            var sm = this.getSmartStore(payload.isGlobalStore);
            if (!sm) {
                errorCB("No active account");
            } else {
                var indexspecs = this.smartStore.IndexSpec.jsonToIndexSpecCollection(specs);
                sm.dropSoup(payload.soupName);
                successCB();
            }
        }

        public getSoupIndexSpecs(successCB, errorCB, args) {
            var payload = args[1];
            this.logger.storeConsole["debug"] = "SmartStore.getSoupIndexSpecs:isGlobalStore=" + payload.isGlobalStore + ",soupName=" + payload.soupName;
            var sm = this.getSmartStore(payload.isGlobalStore);
            if (!sm) {
                errorCB("No active account");
            } else {
                var specs = sm.getSoupIndexSpecsSerialized(payload.soupName);
                successCB(specs);
            }
        }

        public alterSoup(successCB, errorCB, args) {
            errorCB("Not supported");
        }

        public reIndexSoup(successCB, errorCB, args) {
            errorCB("Not supported");
        }

        public clearSoup = function (successCB, errorCB, args) {
            var payload = args[1];
            this.logger.storeConsole["debug"] = "SmartStore.clearSoup:isGlobalStore=" + payload.isGlobalStore + ",soupName=" + payload.soupName;
            var sm = this.getSmartStore(payload.isGlobalStore);
            if (!sm) {
                errorCB("No active account");
            } else {
                sm.clearSoup(payload.soupName);
                successCB();
            }
        }

        public soupExists(successCB, errorCB, args) {
            if (this.checkFirstArg(arguments)) return;
            var payload = args[1];
            this.logger.storeConsole["debug"] = "SmartStore.soupExists:isGlobalStore=" + payload.isGlobalStore + ",soupName=" + payload.soupName;
            var sm = this.getSmartStore(payload.isGlobalStore);
            if (!sm) {
                errorCB("No active account");
            } else {
                successCB(sm.hasSoup(payload.soupName));
            }
        }

        public querySoup(successCB, errorCB, args) {
            var payload = args[1];
            var spec = payload.querySpec;
            if (spec.queryType == "smart") throw new Error("Smart queries can only be run using runSmartQuery");
            this.logger.storeConsole["debug"] = "SmartStore.querySoup:isGlobalStore=" + payload.isGlobalStore + ",soupName=" + payload.soupName + ",indexPath=" + spec.indexPath;
            var sm = this.getSmartStore(payload.isGlobalStore);
            if (!sm) {
                errorCB("No active account");
            } else {
                var qs;
                switch (spec.queryType) {
                    case "exact":
                        qs = this.smartStore.QuerySpec.buildExactQuerySpec(payload.soupName,spec.path, spec.exactMatchKey, spec.pageSize);
                        break;
                    case "like":
                        qs = this.smartStore.QuerySpec.buildLikeQuerySpec(payload.soupName, spec.path, spec.likeKey, spec.order, spec.pageSize);
                        break;
                    case "range":
                        qs = this.smartStore.QuerySpec.buildRangeQuerySpec(payload.soupName, spec.path, spec.beginKey, spec.endKey, spec.order, spec.pageSize);
                        break;
                    default:
                        qs = this.smartStore.QuerySpec.buildSmartQuerySpec(spec.smartSql, spec.pageSize);
                }
                var smart = this.smartStore.QuerySpec.buildSmartQuerySpec(spec.smartSql, spec.pageSize);
                successCB(sm.query(qs, payload.pageIndex));
            }
        }

        runSmartQuery(successCB, errorCB, args) {
            var payload = args[1];
            var spec = payload.querySpec;
            this.logger.storeConsole["debug"] = "SmartStore.runSmartQuery:isGlobalStore=" + payload.isGlobalStore + ",soupName=" + payload.soupName + ",indexPath=" + spec.indexPath;
            var sm = this.getSmartStore(payload.isGlobalStore);
            if (!sm) {
                errorCB("No active account");
            } else {
                var smart = this.smartStore.QuerySpec.buildSmartQuerySpec(spec.smartSql, spec.pageSize);
                successCB(sm.query(smart, payload.pageIndex));
            }
        }

        public retrieveSoupEntries(successCB, errorCB, args) {
            var payload = args[1];
            this.logger.storeConsole["debug"] = "SmartStore.soupExists:isGlobalStore=" + payload.isGlobalStore + ",soupName=" + payload.soupName + ",entryIds=" + payload.entryIds;
            var sm = this.getSmartStore(payload.isGlobalStore);
            if (!sm) {
                errorCB("No active account");
            } else {
                successCB(sm.retrieve(payload.soupName, payload.entryIds));
            }
        }

        public upsertSoupEntries(successCB, errorCB, args) {
            args[1].externalIdPath = "_soupEntryId";
            this.upsertSoupEntriesWithExternalId(successCB, errorCB, args);
        }

        private upsertSoupEntriesWithExternalId(successCB, errorCB, args) {
            var payload = args[1];
            this.logger.storeConsole["debug"] = "SmartStore.upsertSoupEntries:isGlobalStore=" + payload.isGlobalStore + ",soupName=" + payload.soupName + ",entries=" + payload.entries.length + ",externalIdPath=" + payload.externalIdPath;
            var sm = this.getSmartStore(payload.isGlobalStore);
            if (!sm) {
                errorCB("No active account");
            } else {
                payload.entries.forEach(function (record) {
                    sm.upsert(payload.soupName, JSON.stringify(record), payload.externalIdPath)
                });
                successCB(payload.entries);
            }
        }

        public removeFromSoup(successCB, errorCB, args) {
            var payload = args[1];
            this.logger.storeConsole["debug"] = "SmartStore.removeFromSoup:isGlobalStore=" + payload.isGlobalStore + ",soupName=" + payload.soupName + ",entryIds=" + payload.entryIds;
            var sm = this.getSmartStore(payload.isGlobalStore);
            if (!sm) {
                errorCB("No active account");
            } else {
                successCB(sm.delete(payload.soupName, payload.entryIds, true));
            }
        }
    }
}