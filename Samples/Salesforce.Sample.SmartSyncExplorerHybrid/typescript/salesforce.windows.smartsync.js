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
/// <reference path="../typings/Salesforce.SDK.Hybrid.SmartSync.d.ts"/>
/// <reference path="../typings/winrt.d.ts"/>
var SmartSyncJS;
(function (SmartSyncJS) {
    var SmartSync = (function () {
        function SmartSync() {
            this.smartSync = Salesforce.SDK.Hybrid.SmartSync;
        }
        SmartSync.prototype.checkFirstArg = function (argumentsOfCaller) {
            var args = Array.prototype.slice.call(argumentsOfCaller);
            if (typeof (args[0]) !== "boolean") {
                args.unshift(false);
                argumentsOfCaller.callee.apply(null, args);
                return true;
            }
            else {
                return false;
            }
        };
        SmartSync.prototype.getInstance = function () {
            return this.smartSync.SyncManager.getInstance();
        };
        SmartSync.prototype.syncDown = function (args) {
            var syncmanager = this.getInstance();
            if (!syncmanager) {
                console.log("Error in getting instance for SmartSync");
            }
            else {
                var sync = syncmanager.syncDown(args[0], args[1], args[2]);
            }
        };
        SmartSync.prototype.reSync = function (success, fail, args) {
            var payload = args[0];
            var syncmanager = this.getInstance();
            if (!syncmanager) {
                fail("Error in getting instance for SmartSync");
            }
            else {
                syncmanager.reSync(payload.syncId, success("Resync Successful"));
                success("Complete re-sync");
            }
        };
        SmartSync.prototype.syncUp = function (args) {
            var syncmanager = this.getInstance();
            if (!syncmanager) {
                console.log("Error in getting instance for SmartSync");
            }
            else {
                var syncState = syncmanager.syncUp(args[0], args[1], args[2]);
            }
        };
        SmartSync.prototype.getSyncStatus = function (success, fail, args) {
            var payload = args[0];
            var syncmanager = this.getInstance();
            if (!syncmanager) {
                fail("Error in getting instance for SmartSync");
            }
            else {
                var syncState = syncmanager.getSyncStatus(payload.syncId);
                success(syncState);
            }
        };
        return SmartSync;
    }());
    SmartSyncJS.SmartSync = SmartSync;
})(SmartSyncJS || (SmartSyncJS = {}));
//# sourceMappingURL=salesforce.windows.smartsync.js.map