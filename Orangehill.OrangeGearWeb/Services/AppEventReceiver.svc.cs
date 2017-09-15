using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using Microsoft.SharePoint.Client;
using Microsoft.SharePoint.Client.EventReceivers;

//using Orangehill.OrangeGear.ProvisioningInfrastructure;

namespace Orangehill.OrangeGearWeb.Services
{
    public class AppEventReceiver : IRemoteEventService
    {
        /// <summary>
        /// Handles app events that occur after the app is installed or upgraded, or when app is being uninstalled.
        /// </summary>
        /// <param name="properties">Holds information about the app event.</param>
        /// <returns>Holds information returned from the app event.</returns>
        public SPRemoteEventResult ProcessEvent(SPRemoteEventProperties properties)
        {
            SPRemoteEventResult result = new SPRemoteEventResult();
            switch (properties.EventType)
            {
                case SPRemoteEventType.AppInstalled:
                    AppInstalled(properties);
                    break;
                case SPRemoteEventType.AppUpgraded:
                    break;
                case SPRemoteEventType.AppUninstalling:
                    break;
            }

            

            return result;
        }

        /// <summary>
        /// This method is a required placeholder, but is not used by app events.
        /// </summary>
        /// <param name="properties">Unused.</param>
        public void ProcessOneWayEvent(SPRemoteEventProperties properties)
        {
            throw new NotImplementedException();
        }

        public void AppInstalled(SPRemoteEventProperties properties)
        {
            using (ClientContext clientContext = TokenHelper.CreateAppEventClientContext(properties, useAppWeb: false))
            {
                if (clientContext != null)
                {
                    clientContext.Load(clientContext.Web);
                    clientContext.Load(clientContext.Site);
                    clientContext.Load(clientContext.Site.RootWeb);
                    clientContext.ExecuteQuery();

                    Site site = clientContext.Site;
                    Web rootWeb = site.RootWeb;

                    //AppProvisioning.ApplyInstallTemplate(rootWeb);

                }
            }
        }
    }
}
