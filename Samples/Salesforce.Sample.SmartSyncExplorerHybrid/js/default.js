// For an introduction to the Blank template, see the following documentation:
// http://go.microsoft.com/fwlink/?LinkId=232509
(function () {

    var app = WinJS.Application;
    var activation = Windows.ApplicationModel.Activation;
    var oauth = new SalesforceJS.OAuth2();
    var smartSync = new SmartSyncJS.SmartSync();

    var fetchServers = function () {
        var listItemsHtml = document.querySelector('#servers');
        for (var i = 0; i < oauth.servers.serverList.length; i++) {
            var server = oauth.servers.serverList[i];
            var buttonli = document.createElement("li");
            var buttondiv = document.createElement("div");
            var userButton = document.createElement("button");
            buttonli.setAttribute("class", "table-view-cell");
            buttonli.setAttribute("align", "center");
            buttondiv.setAttribute("class", "media-body");
            userButton.addEventListener("click", serverItem(server), false);
            userButton.innerText = "Login User to: " + server.address;
            buttondiv.appendChild(userButton);
            buttonli.appendChild(buttondiv);
            listItemsHtml.appendChild(buttonli);
        }
    }

    var fetchUsers = function () {
        var accounts;
        var account;

        oauth.getUser(function success(result) {
            account = result;
        });
        oauth.getUsers(function success(result) {
            accounts = result;
        });
        var buttonli;
        var buttondiv;
        var userButton;
        var listItemsHtml = document.querySelector('#users');
        if (accounts != null) {
            for (var x = 0; x < accounts.length; x++) {
                var current = accounts[x];
                if (current.userId == account.userId) {
                    var li = document.createElement("li");
                    var div = document.createElement("div");

                    li.setAttribute("class", "table-view-cell");
                    div.setAttribute("class", "media-body");

                    div.innerHTML = current.userName;
                    li.appendChild(div);
                    listItemsHtml.appendChild(li);
                } else {
                    buttonli = document.createElement("li");
                    buttondiv = document.createElement("div");
                    userButton = document.createElement("button");
                    buttonli.setAttribute("class", "table-view-cell");
                    buttonli.setAttribute("align", "center");
                    buttondiv.setAttribute("class", "media-body");
                    userButton.addEventListener("click", userItem(current), false);
                    userButton.innerText = current.userName;
                    buttondiv.appendChild(userButton);
                    buttonli.appendChild(buttondiv);
                    listItemsHtml.appendChild(buttonli);
                }
            }
            buttonli = document.createElement("li");
            buttondiv = document.createElement("div");
            var logoutButton = document.createElement("button");
            buttonli.setAttribute("class", "table-view-cell");
            buttonli.setAttribute("align", "center");
            buttondiv.setAttribute("class", "media-body");
            logoutButton.addEventListener("click", logout, false);
            logoutButton.innerText = "Logout";
            buttondiv.appendChild(logoutButton);
            buttonli.appendChild(buttondiv);
            listItemsHtml.appendChild(buttonli);
        }
    }

    var userItem = function (account) {
        return function () { switchUser(account); }
    }

    var serverItem = function (server) {
        return function () {
            oauth.login(server).done(function () {
                refresh();
            }, function (error) {
                startup();
            });
        }
    }

    var smart = Salesforce.SDK.Hybrid.SmartStore;
    var smartstore;
    var syncmanager;

    var goBack = function() {
        var details = document.getElementById("contactdetails");
        var contacts = document.getElementById("contacts");
        var syncbutton = document.getElementById("syncbutton");
        var addbutton = document.getElementById("addbutton");

        contacts.setAttribute("style", "display: block;");
        syncbutton.setAttribute("style", "display: block;");
        addbutton.setAttribute("style", "display: block;");
        details.setAttribute("style", "display: none;");
    }

    var deletecontact = function (contactid) {
        var soupEntryId = smartstore.lookupSoupEntryId("contacts", "Id", contactid);
        var idArray = [soupEntryId];
        var item = smartstore.retrieve("contacts",idArray);
        item["__local__"] = true;
        item["__locallyDeleted__"] = true;
        smartstore.upsert("contacts", JSON.stringify(JSON.parse(item)[0]));
        var details = document.getElementById("contactdetails");
        var contacts = document.getElementById("contacts");
        var syncbutton = document.getElementById("syncbutton");
        var addbutton = document.getElementById("addbutton");
        contacts.setAttribute("style", "display: block;");
        syncbutton.setAttribute("style", "display: block;");
        addbutton.setAttribute("style", "display: block;");
        details.setAttribute("style", "display: none;");
    }

    var navigatetodetails = function (contact) {
        //get contact with ID from smartstore
        var details = document.getElementById("contactdetails");
        var contacts = document.getElementById("contacts");
        var syncbutton = document.getElementById("syncbutton");
        var addbutton = document.getElementById("addbutton");
        var name = contact.Name.split(" ");

        document.getElementById("firstname").value = name[0];
        document.getElementById("lastname").value = name[1];
        document.getElementById("title").value = contact.Title;
        document.getElementById("email").value = contact.Email;
        document.getElementById("homephone").value = contact.Phone;
        document.getElementById("contactid").value = contact.Id;
        document.getElementById("soupentryid").value = contact._soupEntryId;
        contacts.setAttribute("style", "display: none;");
        syncbutton.setAttribute("style", "display: none;");
        addbutton.setAttribute("style", "display: none;");
        details.setAttribute("style", "display: block;");
    }

    var loaddatafromsmartstore = function(element) {
        if (smartstore.hasSoup("contacts")) {
            var queryspec = smart.QuerySpec.buildAllQuerySpec("contacts", "Name", 0, 4000);
            var results = smartstore.query(queryspec, 0);
            if (results == null) {
                return;
            }
            
            var contacts = JSON.parse(results);
            var listItemsHtml = document.querySelector('#contacts');
            for (var i = 0; i < contacts.length; i++) {
                if (element != null) {
                    if (contacts[i].id === element.id) {
                        contacts[i] = element;
                    }
                }
                var li = document.createElement("li");
                var div = document.createElement("div");
                //Setup li element
                li.setAttribute("class", "table-view-cell");
                li.setAttribute("id", "contact" + contacts[i].Id);
                //Set up div that holds the contact info
                div.setAttribute("class", "media-body");
                div.innerHTML = contacts[i].Name;
                //Ad div to li element
                li.appendChild(div);
                //Add everything to the contacts div
                listItemsHtml.appendChild(li);
                li.addEventListener("click", function (row) {
                    return function() {
                        navigatetodetails(row);
                    };
                }(contacts[i]));
            }
        }
    }

    var handlesyncupdate = function (sync) {
        if (sync.status !== 0) {
            return;
        }
        switch (sync.syncType) {
            case 0:
                loaddatafromsmartstore(null);
                break;
        }
    }

    var fetchContacts = function () {
        var soql = 'SELECT Id, Name, Title, Department, Phone, Email FROM Contact LIMIT 4000';
        var syncId = -1;
        oauth.getUser(function success(result) {
            smartstore = smart.SmartStore.getSmartStore(result);
            syncmanager = Salesforce.SDK.Hybrid.SmartSync.SyncManager.getInstance(result);
        }, function fail(error) {
            console.log("Error in getting account information: " + error);
        });

        var indexspec = [
            new smart.IndexSpec("Id", smart.SmartStoreType.smartString),
            new smart.IndexSpec("Name", smart.SmartStoreType.smartString),
            new smart.IndexSpec("__locallycreated__", smart.SmartStoreType.smartString),
            new smart.IndexSpec("__locally_updated__", smart.SmartStoreType.smartString),
            new smart.IndexSpec("__locally_deleted__", smart.SmartStoreType.smartString),
            new smart.IndexSpec("__local__", smart.SmartStoreType.smartString)
        ];

        smartstore.registerSoup("contacts", indexspec);
        if (syncId === -1) {
            var target = new Salesforce.SDK.Hybrid.SmartSync.Models.SoqlSyncDownTarget(soql);
            var sync = syncmanager.syncDown(target.asJson(), "contacts", null, null);
            handlesyncupdate(sync);
            loaddatafromsmartstore(null);
            syncId = sync.id;
        }
        else {
            syncmanager.reSync(syncId, handlesyncupdate);
        }
    }

    var showOfflineBanner = function () {
        var notifications = Windows.UI.Notifications;

        // Get the toast notification manager for the current app.
        var notificationManager = notifications.ToastNotificationManager;

        // Use an existing template for toasts
        var template = notifications.ToastTemplateType.toastImageAndText01;
        var toastXml = notificationManager.getTemplateContent(notifications.ToastTemplateType[template]);

        // Set the image and text for toast
        var images = toastXml.getElementsByTagName("image");
        images[0].setAttribute("src", "images/offline.png");

        var textNodes = toastXml.getElementsByTagName("text");
        textNodes.forEach(function (value, index) {
            var textNumber = index + 1;
            var text = "";
            for (var j = 0; j < 10; j++) {
                text += "Text input " + /*@static_cast(String)*/textNumber + " ";
            }
            value.appendChild(toastXml.createTextNode(text));
        });

        // Create a toast notification from the XML, then create a ToastNotifier object
        // to send the toast.
        var toast = new notifications.ToastNotification(toastXml);

        notificationManager.createToastNotifier().show(toast);
    }

    var syncdata = function() {
        if (navigator.onLine) {
            var smart = Salesforce.SDK.Hybrid.SmartStore;
            var smartstore;
            var syncState;
            oauth.getUser(function success(result) {
                smartstore = smart.SmartStore.getSmartStore(result);
            }, function fail(error) {
                console.log("Error in getting account information: " + error);
            });
            var fieldlist = ["FirstName", "LastName", "Title", "HomePhone", "Email", "Department"];
            var mergemodeoptions = Salesforce.SDK.Hybrid.SmartSync.Models.MergeModeOptions;
            var options = Salesforce.SDK.Hybrid.SmartSync.Models.SyncOptions.optionsForSyncUp(fieldlist, mergemodeoptions.leaveIfChanged);
            var target = new Salesforce.SDK.Hybrid.SmartSync.Models.SyncUpTarget;
            var args = [false, target, options, "contacts"];
            smartSync.syncUp(function success(result) {
                syncState = result;
            }, function fail(result) {
                syncState = result;
            },
            args);
            //var sync = syncmanager.syncUp(target, options, "contacts", null);
            //handlesyncupdate(sync);
            loaddatafromsmartstore(null);
        } else {
            //Show a toast stating no netwrok available
            showOfflineBanner();
        }
    }

    var switchUser = function (account) {
        oauth.switchToUser(account).done(function success() {
            refresh();
        });
    }

    var logout = function () {
        oauth.logout().done(startup());
           /* .then(function () {
                var accounts;
                oauth.getUser(function success(result) {
                    accounts = result;
                });
                if (accounts.length > 0) {
                    switchUser(accounts[0]);
                } else {
                    startup();
                }
            });*/
    }

    var refresh = function () {
        clearRecords('#contacts');
        fetchContacts();
        var contacts = document.getElementById("contacts");
        var contactdetails = document.getElementById("contactdetails");
        //Show contacts div
        contacts.setAttribute("style", "display: block;");
        //Set up button for Sync
        var syncbutton = document.getElementById("syncbutton");
        syncbutton.onclick = syncdata;
        //Setup button for adding new contact
        var addbutton = document.getElementById("addbutton");
        addbutton.onclick = function() {
            contacts.setAttribute("style", "display: none;");
            document.getElementById("contactid").value = '';
            document.getElementById("soupentryid").value = '';
            document.getElementById("firstname").value = '';
            document.getElementById("lastname").value = '';
            document.getElementById("title").value = '';
            document.getElementById("department").value = '';
            document.getElementById("email").value = '';
            document.getElementById("homephone").value = '';
            contactdetails.setAttribute("style", "display: block;");
        }
        //Setup back button
        var backbutton = document.getElementById("backbutton");
        backbutton.addEventListener("click", goBack);
        //Setup button for saving edited/added information for a contact
        var savebutton = document.getElementById("savebutton");
        savebutton.onclick = function () {
            contactdetails.setAttribute("style", "display: none;");
            contacts.setAttribute("style", "display: block;");
            var id = document.getElementById("id");
            if (id == null)
                savecontact(true);
            else
                savecontact(false);
            loaddatafromsmartstore(null);
        }

        //Setup button for deleting contact
        var deletebutton = document.getElementById("deletebutton");
        deletebutton.onclick = function () {
            var id = document.getElementById("contactid").value;
            deletecontact(id);
            contactdetails.setAttribute("style", "display: none;");
            contacts.setAttribute("style", "display: block;");
        }

        //Setuo button for logout
        var logoutbutton = document.getElementById("logoutbutton");
        logoutbutton.onclick = function() {
            logout();
        }
    }

    var savecontact = function (isCreated) {
        var firstname = document.getElementById("firstname").value;
        var lastname = document.getElementById("lastname").value;
        var title = document.getElementById("title").value;
        var email = document.getElementById("email").value;
        var department = document.getElementById("department").value;
        var homephone = document.getElementById("homephone").value;

        //var id = "local_" + smartstore.currentTimeMillis;
        if (isCreated) {
            var id = "local_" + smartstore.currentTimeMillis;
            var soupEntryId = " ";
        } else {
            var id = document.getElementById("contactid").value;
            var soupEntryId = document.getElementById("soupentryid").value;
        }
        var attributes = { Type: "Contact" };
        var contact = {
            Id: id,
            Firstname: firstname,
            Lastname: lastname,
            Name: firstname + " " + lastname,
            Title: title,
            Phone: homephone,
            Email: email,
            Department: department,
            __local__: true,
            __locallyUpdated__: !isCreated,
            __locallyCreated__: isCreated,
            __locallyDeleted__: false,
            _soupEntryId: soupEntryId
        };
        if (isCreated) {
            contact['attributes'] = attributes;
            smartstore.create("contacts", JSON.stringify(contact));
        } else {
            var info = smartstore.upsert("contacts", JSON.stringify(contact));
        }
        refresh();
    }

    var clearRecords = function (table) {
        var elmtTable = document.querySelector(table);
        var tableRows = elmtTable.getElementsByTagName('li');
        var rowCount = tableRows.length;

        for (var x = rowCount - 1; x >= 0; x--) {
            elmtTable.removeChild(tableRows[x]);
        }
    }

    var startup = function () {
        oauth.configureOAuth("data/bootconfig.json", null)
            .then(function () {
                oauth.getUsers(function success(result) {
                    refresh();

                }, function fail(result) {
                    oauth.loginDefaultServer().done(function () {
                        refresh();
                    }, function (error) {
                        startup();
                    });
                });
            });
    }

    app.onactivated = function (args) {
        if (args.detail.kind === activation.ActivationKind.launch) {
            if (args.detail.previousExecutionState !== activation.ApplicationExecutionState.terminated) {
                startup();
            } else {
                startup();
            }
            args.setPromise(WinJS.UI.processAll());
        }
    };

    app.oncheckpoint = function (args) {
        // TODO: This application is about to be suspended. Save any state
        // that needs to persist across suspensions here. You might use the
        // WinJS.Application.sessionState object, which is automatically
        // saved and restored across suspension. If you need to complete an
        // asynchronous operation before your application is suspended, call
        // args.setPromise().
    };

    app.start();
})();