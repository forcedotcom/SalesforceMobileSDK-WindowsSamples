/*
 * Copyright (c) 2013, salesforce.com, inc.
 * All rights reserved.
 * Redistribution and use of this software in source and binary forms, with or
 * without modification, are permitted provided that the following conditions
 * are met:
 * - Redistributions of source code must retain the above copyright notice, this
 * list of conditions and the following disclaimer.
 * - Redistributions in binary form must reproduce the above copyright notice,
 * this list of conditions and the following disclaimer in the documentation
 * and/or other materials provided with the distribution.
 * - Neither the name of salesforce.com, inc. nor the names of its contributors
 * may be used to endorse or promote products derived from this software without
 * specific prior written permission of salesforce.com, inc.
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 * ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE
 * LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 * POSSIBILITY OF SUCH DAMAGE.
 */

using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Net.Http;
using System.Threading;
using Windows.UI;
using Windows.UI.Xaml;
using Windows.UI.Xaml.Controls;
using Windows.UI.Xaml.Media;
using Salesforce.Sample.RestExplorer.Shared;
using Salesforce.Sample.RestExplorer.ViewModels;
using Salesforce.SDK.Auth;
using Salesforce.SDK.Native;
using Salesforce.SDK.Net;
using Salesforce.SDK.Rest;

namespace Salesforce.Sample.RestExplorer.Store
{
    /// <summary>
    ///     Only page of the Rest Explorer Store application
    /// </summary>
    public sealed partial class MainPage : NativeMainPage
    {
        private readonly RestActionViewModel _viewModel;
        private Button[] _buttons;

        /// <summary>
        ///     Constructor
        /// </summary>
        public MainPage()
        {
            InitializeComponent();
            _viewModel = DataContext as RestActionViewModel;
            _viewModel.PropertyChanged += OnViewModelPropertyChanged;
            _viewModel.SyncContext = SynchronizationContext.Current;
            _buttons = new[]
            {
                btnSwitch, btnVersions, btnResources, btnDescribeGlobal, btnDescribe, btnMetadata, btnCreate, btnRetrieve,
                btnUpdate, btnUpsert, btnDelete, btnQuery, btnSearch, btnManual, btnLogout, btnOwnedFiles, btnFilesInGroups,
                btnFilesSharedWithMe
            };

            foreach (Button button in _buttons)
            {
                button.Click += OnAnyButtonClicked;
            }

            SwitchToRestAction(RestAction.Versions, string.Empty);
        }

        /// <summary>
        ///     Watching the RETURNED_REST_RESPONSE of the ViewModel and showing the response (formatted) in the result webview
        ///     control
        /// </summary>
        /// <param name="sender"></param>
        /// <param name="e"></param>
        private void OnViewModelPropertyChanged(object sender, PropertyChangedEventArgs e)
        {
            if (e.PropertyName == RestActionViewModel.RETURNED_REST_RESPONSE)
            {
                // Data binding would be more elegant
                ShowResponse(_viewModel.ReturnedRestResponse);
            }
        }


        /// <summary>
        ///     When one of the button is clicked, we go hide/show the adequate input controls in the right pane
        /// </summary>
        /// <param name="sender"></param>
        /// <param name="e"></param>
        private void OnAnyButtonClicked(object sender, RoutedEventArgs e)
        {
            var restAction = RestAction.Versions;
            var path = string.Empty;
            switch (((Button) sender).Name)
            {
                case "btnLogout":
                    OnLogout();
                    return;
                case "btnSwitch":
                    OnSwitch();
                    return;
                case "btnManual":
                    restAction = RestAction.Manual;
                    break;
                case "btnCreate":
                    restAction = RestAction.Create;
                    break;
                case "btnDelete":
                    restAction = RestAction.Delete;
                    break;
                case "btnDescribe":
                    restAction = RestAction.Describe;
                    break;
                case "btnDescribeGlobal":
                    restAction = RestAction.DescribeGlobal;
                    break;
                case "btnMetadata":
                    restAction = RestAction.Metadata;
                    break;
                case "btnQuery":
                    restAction = RestAction.Query;
                    break;
                case "btnResources":
                    restAction = RestAction.Resources;
                    break;
                case "btnRetrieve":
                    restAction = RestAction.Retrieve;
                    break;
                case "btnSearch":
                    restAction = RestAction.Search;
                    break;
                case "btnUpdate":
                    restAction = RestAction.Update;
                    break;
                case "btnUpsert":
                    restAction = RestAction.Upsert;
                    break;
                case "btnVersions":
                    restAction = RestAction.Versions;
                    break;
                case "btnOwnedFiles":
                    restAction = RestAction.Manual;
                    path = "/services/data/{0}/chatter/users/{1}/files";
                    break;
                case "btnFilesInGroups":
                    restAction = RestAction.Manual;
                    path = "/services/data/{0}/chatter/users/{1}/files/filter/groups";
                    break;
                case "btnFilesSharedWithMe":
                    restAction = RestAction.Manual;
                    path = "/services/data/{0}/chatter/users/{1}/files/filter/sharedwithme";
                    break;
            }
            SwitchToRestAction(restAction, path);
        }

        private void OnSwitch()
        {
            AccountManager.SwitchAccount();
        }

        /// <summary>
        ///     Helper method called when user select a Rest action
        /// </summary>
        /// <param name="restAction"></param>
        private void SwitchToRestAction(RestAction restAction, string path)
        {
            ShowResponse(null);
            var requestPath = string.Empty;
            string restActionStr = restAction.ToString();
            _viewModel[RestActionViewModel.SELECTED_REST_ACTION] = restActionStr;
            if (!String.IsNullOrWhiteSpace(path))
            {
                var account = AccountManager.GetAccount();
                requestPath = String.Format(path, ApiVersionStrings.VersionNumber, account.UserId);
                _viewModel[RestActionViewModel.REQUEST_PATH] = requestPath;
            }
            HashSet<string> names = RestActionViewHelper.GetNamesOfControlsToShow(restActionStr);
            foreach (TextBox tb in new[]
            {
                tbApiVersion, tbObjectType,
                tbObjectId, tbExternalIdField, tbExternalId, tbFieldList, tbFields,
                tbSoql, tbSosl, tbRequestPath, tbRequestBody, tbRequestMethod
            })
            {
                tb.Visibility = names.Contains(tb.Name) ? Visibility.Visible : Visibility.Collapsed;
                tb.BorderThickness = new Thickness(0,0,0,0);
            }
            if (!String.IsNullOrWhiteSpace(path))
            {
                tbRequestPath.Text = requestPath;
            } 

        }

        /// <summary>
        ///     Helper method to show a RestResponse (formatted) in the result webview control
        /// </summary>
        /// <param name="response"></param>
        private void ShowResponse(RestResponse response)
        {
            wbResult.NavigateToString(RestActionViewHelper.BuildHtml(response));
        }
    }
}