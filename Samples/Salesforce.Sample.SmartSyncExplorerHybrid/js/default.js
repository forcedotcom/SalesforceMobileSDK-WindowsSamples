// For an introduction to the Blank template, see the following documentation:
// http://go.microsoft.com/fwlink/?LinkId=232509
(function () {

    var app = WinJS.Application;
    var activation = Windows.ApplicationModel.Activation;
    var oauth = new SalesforceJS.OAuth2();
    var smartstore = new SmartStoreJS.SmartStore();
    var smartsync = new SmartSyncJS.SmartSync();
    var queryspec = new SmartStoreJS.QuerySpec();

    

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

    var goBack = function () {
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
        smartstore.lookupSoupEntryId(function (soupEntryId) {
            var idArray = [soupEntryId];
            var contact;
            smartstore.retrieveSoupEntries(function (item) {
                contact = JSON.parse(item);
            }, function () {
                console.log("Error in retrieving contact from smart store")
            }, ["contacts", idArray]);

            contact[0].__local__ = true;
            contact[0].__locally_deleted__ = true;

            smartstore.upsertSoupEntries(function () {
                var details = document.getElementById("contactdetails");
                var contacts = document.getElementById("contacts");
                var syncbutton = document.getElementById("syncbutton");
                var addbutton = document.getElementById("addbutton");
                contacts.setAttribute("style", "display: block;");
                syncbutton.setAttribute("style", "display: block;");
                addbutton.setAttribute("style", "display: block;");
                details.setAttribute("style", "display: none;");
                loaddatafromsmartstore(null);
            }, function () {
                console.log("Error in deleting contact");
            }, ["contacts", contact]);
        }, function () {
            console.log("Error in looking up soup entry");
        }, ["contacts", "Id", contactid]);

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
        smartstore.hasSoup(function(success) {
            if (success === true) {
                var spec = queryspec.buildAllQuerySpec("contacts", "Name", "ascending", 4000);
                smartstore.querySoup(function(results) {
                    if (results) {
                        var contacts = JSON.parse(results);
                        var listItemsHtml = document.querySelector('#contacts');
                        for (var i = 0; i < contacts.length; i++) {
                            if (!contacts[i].__locally_deleted__) {
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
                                    return function () {
                                        navigatetodetails(row);
                                    };
                                }(contacts[i]));
                            }
                        }
                    }
                }, function(error) {
                    console.log(error);
                }, [spec, 0]);
            }
        }, function(error) {
            console.log(error);
        }, ["contacts"]); 
    }

    var handlesyncupdate = function (sync) {
        if (sync.status === 2) {
            return;
        }
        switch (sync.syncType) {
            case 0:
                if (sync.progress < 100) {
                    console.log("Sync in progress");
                } else {
                    loaddatafromsmartstore(null);
                }

                break;
            case 1:
                loaddatafromsmartstore(null);
        }
    }

    var fetchContacts = function () {
        var soql = 'SELECT Id, Name, Title, Department, Phone, Email FROM Contact LIMIT 4000';
        var syncId = -1;
        oauth.getUser(function success(result) {
            var store = smartstore.getSmartStore(false);
            syncmanager = smartsync.getInstance(result);
        }, function fail(error) {
            console.log("Error in getting account information: " + error);
        });

        var smartstoretype = Salesforce.SDK.Hybrid.SmartStore.SmartStoreType;

        var indexspec = [
            new SmartStoreJS.IndexSpec("Id", smartstoretype.smartString.columnType),
            new SmartStoreJS.IndexSpec("Name", smartstoretype.smartString.columnType),
            new SmartStoreJS.IndexSpec("__locally_created__", smartstoretype.smartString.columnType),
            new SmartStoreJS.IndexSpec("__locally_updated__", smartstoretype.smartString.columnType),
            new SmartStoreJS.IndexSpec("__locally_deleted__", smartstoretype.smartString.columnType),
            new SmartStoreJS.IndexSpec("__local__", smartstoretype.smartString.columnType)
        ];

        smartstore.registerSoup(function () {
            console.log("Soup registered successfully!");
        }, function () {
            console.log("Error in registering soup");
        }, ["contacts", indexspec]);
        if (syncId === -1) {
            var target = new Salesforce.SDK.Hybrid.SmartSync.Models.SoqlSyncDownTarget(soql);
            smartsync.syncDown([target.asJson(), "contacts", null]);
            loaddatafromsmartstore(null);
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

    var syncdata = function () {
        if (navigator.onLine) {
            var fieldlist = ["FirstName", "LastName", "Title", "HomePhone", "Email", "Department"];
            var mergemodeoptions = Salesforce.SDK.Hybrid.SmartSync.Models.MergeModeOptions;
            var options = Salesforce.SDK.Hybrid.SmartSync.Models.SyncOptions.optionsForSyncUp(fieldlist, mergemodeoptions.leaveIfChanged);
            var target = new Salesforce.SDK.Hybrid.SmartSync.Models.SyncUpTarget();
            var args = [target, options, "contacts"];
            smartsync.syncUp(args);
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
        addbutton.onclick = function () {
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
            var element = document.getElementById("contactid");
            if (element.value == null || element.value == '')
                savecontact(true);
            else
                savecontact(false);
            loaddatafromsmartstore(element);
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
        logoutbutton.onclick = function () {
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
        if (isCreated) {
            var id = "local_" + smartstore.currentTimeMillis();
            var soupEntryId = " ";
        } else {
            var id = document.getElementById("contactid").value;
            var soupEntryId = document.getElementById("soupentryid").value;
        }
        var attributes = { type: "Contact" };
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
            __locally_updated__: !isCreated,
            __locally_created__: isCreated,
            __locally_deleted__: false,
            _soupEntryId: soupEntryId
        };
        if (isCreated) {
            contact['attributes'] = attributes;
            smartstore.createSoupEntries(function () {
                refresh();
            }, function () {
                console.log("Error in adding record to smarstore");
            }, ["contacts", [contact]]);
        } else {
            smartstore.upsertSoupEntries(function () {
                refresh();
            }, function () {
                console.log("Error in saving to smartstore")
            }, ["contacts", [contact]]);
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
            .then(function() {
                oauth.getUsers(function success(result) {
                    refresh();

                }, function fail(result) {
                    oauth.loginDefaultServer().done(function() {
                        refresh();
                    }, function(error) {
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