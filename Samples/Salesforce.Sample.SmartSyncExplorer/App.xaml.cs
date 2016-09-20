/*
 * Copyright (c) 2015, salesforce.com, inc.
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
using Windows.UI.Xaml.Navigation;
using Salesforce.Sample.SmartSyncExplorer.Shared.Pages;
using Salesforce.SDK.App;
using Salesforce.SDK.Auth;
using Salesforce.SDK.Security;
using Windows.ApplicationModel.Activation;
using System.Threading.Tasks;
using Windows.Security.Cryptography.Core;
using Windows.Storage;
using Salesforce.SDK.Core;
using Salesforce.SDK.Hybrid.Logging;
using Salesforce.SDK.Logging;
using Salesforce.Sample.NativeSmartStore.Settings;
using Salesforce.SDK.Settings;
using Salesforce.SDK.Upgrade;


// The Blank Application template is documented at http://go.microsoft.com/fwlink/?LinkId=402347&clcid=0x409

namespace Salesforce.Sample.SmartSyncExplorer
    {
        /// <summary>
    /// Provides application-specific behavior to supplement the default Application class.
        /// </summary>
    sealed partial class App : SalesforceApplication
        {
        /// <summary>
        ///     Invoked when Navigation to a certain page fails
        /// </summary>
        /// <param name="sender">The Frame which failed navigation</param>
        /// <param name="e">Details about the navigation failure</param>
        private void OnNavigationFailed(object sender, NavigationFailedEventArgs e)
        {
            throw new Exception("Failed to load Page " + e.SourcePageType.FullName);
        }

        /// <summary>
        ///     InitializeConfig should implement the commented out code. You should come up with your own, unique password and
        ///     salt and for added security
        ///     you should implement your own key generator using the IKeyGenerator interface.
        /// </summary>
        /// <returns></returns>
        protected override Task InitializeConfig()
        {
            SDKServiceLocator.RegisterService<IEncryptionService, Encryptor>();
            Encryptor.init(new EncryptionSettings(new HmacSHA256KeyGenerator(HashAlgorithmNames.Sha256)));
            var config = SDKManager.InitializeConfigAsync<Config>().Result;
            return config.SaveConfigAsync();
        }

        protected override Task UpgradeConfigAsync()
        {
            if (!ApplicationData.Current.Version.Equals(0)) return Task.CompletedTask;
            var config = SalesforceConfig.RetrieveConfig<Config>().Result;
            if (config == null) return Task.CompletedTask;
            Encryptor.init(new EncryptionSettings(new HmacSHA256KeyGenerator(HashAlgorithmNames.Md5)));
            config = SDKManager.InitializeConfigAsync<Config>().Result;
            Encryptor.ChangeSettings(
                new EncryptionSettings(new HmacSHA256KeyGenerator(HashAlgorithmNames.Sha256)));
            return config.SaveConfigAsync();
        }

            /// <summary>
        ///     This returns the root application of your application. Please adjust to match your actual root page if you use
        ///     something different.
        /// </summary>
        /// <returns></returns>
        protected override Type SetRootApplicationPage()
        {
            return typeof(MainPage);
        }

        protected override void OnActivated(IActivatedEventArgs args)
        {
            base.OnActivated(args);
            if (MainPage.ContactsDataModel != null && AccountManager.GetAccount() != null)
            {
                MainPage.ContactsDataModel.SyncDownContacts();
            }
        }
    }
}