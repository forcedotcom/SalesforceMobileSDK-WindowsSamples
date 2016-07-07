﻿#pragma checksum "C:\repo\samples-fork\Samples\UserList\plugins\com.salesforce\src\windows\src\Universal\Pages\AccountPage.xaml" "{406ea660-64cf-4c82-b6f0-42d48172a799}" "0BA08F43E33FBBAFB1A8B2032727F157"
//------------------------------------------------------------------------------
// <auto-generated>
//     This code was generated by a tool.
//
//     Changes to this file may cause incorrect behavior and will be lost if
//     the code is regenerated.
// </auto-generated>
//------------------------------------------------------------------------------

namespace Salesforce.SDK.Pages
{
    partial class AccountPage : 
        global::Windows.UI.Xaml.Controls.Page, 
        global::Windows.UI.Xaml.Markup.IComponentConnector,
        global::Windows.UI.Xaml.Markup.IComponentConnector2
    {
        /// <summary>
        /// Connect()
        /// </summary>
        [global::System.CodeDom.Compiler.GeneratedCodeAttribute("Microsoft.Windows.UI.Xaml.Build.Tasks"," 14.0.0.0")]
        [global::System.Diagnostics.DebuggerNonUserCodeAttribute()]
        public void Connect(int connectionId, object target)
        {
            switch(connectionId)
            {
            case 1:
                {
                    this.ServerFlyout = (global::Windows.UI.Xaml.Controls.Flyout)(target);
                }
                break;
            case 2:
                {
                    this.AddServerFlyout = (global::Windows.UI.Xaml.Controls.Flyout)(target);
                }
                break;
            case 3:
                {
                    this.MessageFlyout = (global::Windows.UI.Xaml.Controls.Flyout)(target);
                }
                break;
            case 4:
                {
                    this.MessageFlyoutPanel = (global::Windows.UI.Xaml.Controls.StackPanel)(target);
                }
                break;
            case 5:
                {
                    this.MessageContent = (global::Windows.UI.Xaml.Controls.TextBlock)(target);
                }
                break;
            case 6:
                {
                    this.CloseMessageButton = (global::Windows.UI.Xaml.Controls.Button)(target);
                    #line 132 "..\..\..\Pages\AccountPage.xaml"
                    ((global::Windows.UI.Xaml.Controls.Button)this.CloseMessageButton).Click += this.CloseMessageButton_OnClick;
                    #line default
                }
                break;
            case 7:
                {
                    this.AddServerFlyoutPanel = (global::Windows.UI.Xaml.Controls.StackPanel)(target);
                }
                break;
            case 8:
                {
                    this.AddServerFlyoutLabel = (global::Windows.UI.Xaml.Controls.TextBlock)(target);
                }
                break;
            case 9:
                {
                    this.AddCustomHostBtn = (global::Windows.UI.Xaml.Controls.Button)(target);
                    #line 101 "..\..\..\Pages\AccountPage.xaml"
                    ((global::Windows.UI.Xaml.Controls.Button)this.AddCustomHostBtn).Click += this.addCustomHostBtn_Click;
                    #line default
                }
                break;
            case 10:
                {
                    this.CancelCustomHostBtn = (global::Windows.UI.Xaml.Controls.Button)(target);
                    #line 109 "..\..\..\Pages\AccountPage.xaml"
                    ((global::Windows.UI.Xaml.Controls.Button)this.CancelCustomHostBtn).Click += this.cancelCustomHostBtn_Click;
                    #line default
                }
                break;
            case 11:
                {
                    this.lbl_HostAddress = (global::Windows.UI.Xaml.Controls.TextBlock)(target);
                }
                break;
            case 12:
                {
                    this.HostAddress = (global::Windows.UI.Xaml.Controls.TextBox)(target);
                }
                break;
            case 13:
                {
                    this.lbl_HostName = (global::Windows.UI.Xaml.Controls.TextBlock)(target);
                }
                break;
            case 14:
                {
                    this.HostName = (global::Windows.UI.Xaml.Controls.TextBox)(target);
                }
                break;
            case 15:
                {
                    this.ServerFlyoutPanel = (global::Windows.UI.Xaml.Controls.StackPanel)(target);
                }
                break;
            case 16:
                {
                    this.ServerFlyoutLabel = (global::Windows.UI.Xaml.Controls.TextBlock)(target);
                }
                break;
            case 17:
                {
                    this.ListboxServers = (global::Windows.UI.Xaml.Controls.ListBox)(target);
                }
                break;
            case 18:
                {
                    this.AddConnection = (global::Windows.UI.Xaml.Controls.Button)(target);
                    #line 48 "..\..\..\Pages\AccountPage.xaml"
                    ((global::Windows.UI.Xaml.Controls.Button)this.AddConnection).Click += this.addConnection_Click;
                    #line default
                }
                break;
            case 19:
                {
                    global::Salesforce.SDK.Native.ServerControl element19 = (global::Salesforce.SDK.Native.ServerControl)(target);
                    #line 36 "..\..\..\Pages\AccountPage.xaml"
                    ((global::Salesforce.SDK.Native.ServerControl)element19).Delete += this.DeleteServer;
                    #line 36 "..\..\..\Pages\AccountPage.xaml"
                    ((global::Salesforce.SDK.Native.ServerControl)element19).Click += this.ClickServer;
                    #line default
                }
                break;
            case 20:
                {
                    this.PageRoot = (global::Windows.UI.Xaml.Controls.Grid)(target);
                }
                break;
            case 21:
                {
                    this.Container = (global::Windows.UI.Xaml.Controls.StackPanel)(target);
                }
                break;
            case 22:
                {
                    this.ApplicationTitle = (global::Windows.UI.Xaml.Controls.TextBlock)(target);
                }
                break;
            case 23:
                {
                    this.ApplicationLogo = (global::Windows.UI.Xaml.Controls.ItemsControl)(target);
                }
                break;
            case 24:
                {
                    this.MultiUserGrid = (global::Windows.UI.Xaml.Controls.Grid)(target);
                }
                break;
            case 25:
                {
                    this.SingleUserGrid = (global::Windows.UI.Xaml.Controls.Grid)(target);
                }
                break;
            case 26:
                {
                    this.LoginToSalesforce = (global::Windows.UI.Xaml.Controls.Button)(target);
                    #line 190 "..\..\..\Pages\AccountPage.xaml"
                    ((global::Windows.UI.Xaml.Controls.Button)this.LoginToSalesforce).Click += this.LoginToSalesforce_OnClick;
                    #line default
                }
                break;
            case 27:
                {
                    this.ChooseConnection = (global::Windows.UI.Xaml.Controls.Button)(target);
                    #line 197 "..\..\..\Pages\AccountPage.xaml"
                    ((global::Windows.UI.Xaml.Controls.Button)this.ChooseConnection).Click += this.ShowServerFlyout;
                    #line default
                }
                break;
            case 28:
                {
                    this.ListTitle = (global::Windows.UI.Xaml.Controls.TextBlock)(target);
                }
                break;
            case 29:
                {
                    this.AccountsList = (global::Windows.UI.Xaml.Controls.ListBox)(target);
                }
                break;
            case 30:
                {
                    this.LoginView = (global::Windows.UI.Xaml.VisualStateGroup)(target);
                }
                break;
            case 31:
                {
                    this.SingleUser = (global::Windows.UI.Xaml.VisualState)(target);
                }
                break;
            case 32:
                {
                    this.MultipleUser = (global::Windows.UI.Xaml.VisualState)(target);
                }
                break;
            case 33:
                {
                    this.LoggingUserIn = (global::Windows.UI.Xaml.VisualState)(target);
                }
                break;
            case 34:
                {
                    this.LoginBar = (global::Windows.UI.Xaml.Controls.CommandBar)(target);
                }
                break;
            case 35:
                {
                    this.AppBarAddAccount = (global::Windows.UI.Xaml.Controls.AppBarButton)(target);
                    #line 267 "..\..\..\Pages\AccountPage.xaml"
                    ((global::Windows.UI.Xaml.Controls.AppBarButton)this.AppBarAddAccount).Click += this.ShowServerFlyout;
                    #line default
                }
                break;
            default:
                break;
            }
            this._contentLoaded = true;
        }

        [global::System.CodeDom.Compiler.GeneratedCodeAttribute("Microsoft.Windows.UI.Xaml.Build.Tasks"," 14.0.0.0")]
        [global::System.Diagnostics.DebuggerNonUserCodeAttribute()]
        public global::Windows.UI.Xaml.Markup.IComponentConnector GetBindingConnector(int connectionId, object target)
        {
            global::Windows.UI.Xaml.Markup.IComponentConnector returnValue = null;
            return returnValue;
        }
    }
}
