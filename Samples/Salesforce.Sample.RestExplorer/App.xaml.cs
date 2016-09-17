using System;
using System.Threading.Tasks;
using Windows.Security.Cryptography.Core;
using Windows.Storage;
using Windows.UI.Xaml.Navigation;
using Salesforce.SDK.App;
using Salesforce.SDK.Auth;
using Salesforce.SDK.Core;
using Salesforce.SDK.Hybrid.Logging;
using Salesforce.SDK.Logging;
using Salesforce.SDK.Security;
using Salesforce.SDK.Strings;
using Salesforce.Sample.RestExplorer.Shared;
using Salesforce.Sample.RestExplorer.Store;
using Salesforce.SDK.Settings;

// The Blank Application template is documented at http://go.microsoft.com/fwlink/?LinkId=402347&clcid=0x409

namespace Salesforce.Sample.RestExplorer
{
    /// <summary>
    /// Provides application-specific behavior to supplement the default Application class.
    /// </summary>
    sealed partial class App : SalesforceApplication
    {
        /// <summary>
        /// Initializes the singleton application object.  This is the first line of authored code
        /// executed, and as such is the logical equivalent of main() or WinMain().
        /// </summary>
        public App()
        {
            InitializeComponent();

            // Inject our own resources into SDK
            LocalizedStrings.SetResourceLocation("MobileSDK");
        }

        /// <summary>
        ///     Invoked when Navigation to a certain page fails
        /// </summary>
        /// <param name="sender">The Frame which failed navigation</param>
        /// <param name="e">Details about the navigation failure</param>
        private void OnNavigationFailed(object sender, NavigationFailedEventArgs e)
        {
            throw new Exception("Failed to load Page " + e.SourcePageType.FullName);
        }

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

        protected override Type SetRootApplicationPage()
        {
            return typeof(MainPage);
        }
    }
}
