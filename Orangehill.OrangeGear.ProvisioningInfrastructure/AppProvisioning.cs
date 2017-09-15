using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Web;
using System.Web.Configuration;
using System.Web.UI;
using System.Web.UI.WebControls;
using System.Net;


using Microsoft.SharePoint.Client;

using OfficeDevPnP.Core.Utilities;
using OfficeDevPnP.Core.Framework.Provisioning;
using OfficeDevPnP.Core.Framework.Provisioning.Connectors;
using OfficeDevPnP.Core.Framework.Provisioning.Model;
using OfficeDevPnP.Core.Framework.Provisioning.ObjectHandlers;
using OfficeDevPnP.Core.Framework.Provisioning.Providers.Xml;

namespace Orangehill.OrangeGear.ProvisioningInfrastructure
{
    public static partial class AppProvisioning
    {
        const string SharePointNamespaceName = "http://schemas.microsoft.com/sharepoint/";
        const string ActionTitlePrefix = "OrangeHill";
        public static void ApplyInstallTemplate(this Web web)
        {
            string path = HttpContext.Current.Server.MapPath("~/Content");
            string ProvisioningTemplatespath = HttpContext.Current.Server.MapPath("~/Content/ProvisioningTemplates");

            XMLFileSystemTemplateProvider provider = new XMLFileSystemTemplateProvider(ProvisioningTemplatespath, "");
            FileSystemConnector connector = new FileSystemConnector(path, "");

            ProvisioningTemplate AppTemplate = provider.GetTemplate("ProvisioningApp.xml");
            AppTemplate.Connector = connector;
            web.ApplyProvisioningTemplate(AppTemplate);

            ProvisioningTemplate AppContentTemplate = provider.GetTemplate("ProvisioningAppContents.xml");
            AppContentTemplate.Connector = connector;
            web.ApplyProvisioningTemplate(AppContentTemplate);

        }

        public static void ApplyProvisioningTemplate(this Web web)
        {
            string path = HttpContext.Current.Server.MapPath("~/Content");
            string ProvisioningTemplatespath = HttpContext.Current.Server.MapPath("~/Content/ProvisioningTemplates");

            XMLFileSystemTemplateProvider provider = new XMLFileSystemTemplateProvider(ProvisioningTemplatespath, "");
            ProvisioningTemplate template = provider.GetTemplate("ProvisioningSiteAssets.xml");

            FileSystemConnector connector = new FileSystemConnector(path, "");
            template.Connector = connector;

            web.ApplyProvisioningTemplate(template);

        }
        public static void AddJsLink(ClientContext ctx, Web web, string actionTitle, string filename)
        {
            var ActionTitle = ActionTitlePrefix + "_" + actionTitle;
            string scenarioUrl = String.Format("{0}/SiteAssets", web.ServerRelativeUrl);
            string revision = Guid.NewGuid().ToString().Replace("-", "");
            string jsLink = string.Format("{0}/js/{1}?rev={2}", scenarioUrl, filename, revision);

            StringBuilder scripts = new StringBuilder(@"
                var headID = document.getElementsByTagName('head')[0]; ");

            scripts.AppendFormat(@"
                var newScript = document.createElement('script');
                newScript.type = 'text/javascript';
                newScript.src = '{0}';
                headID.appendChild(newScript);", jsLink);

            string scriptBlock = scripts.ToString();

            var existingActions = web.UserCustomActions;
            ctx.Load(existingActions);
            ctx.ExecuteQuery();

            var newAction = existingActions.Add();
            newAction.Description = ActionTitle;
            newAction.Location = "ScriptLink";
            newAction.Name = ActionTitle;
            newAction.Title = ActionTitle;

            newAction.ScriptBlock = scriptBlock;
            newAction.Update();
            ctx.Load(web, s => s.UserCustomActions);
            ctx.ExecuteQuery();
        }

        public static void RemoveJsLink(ClientContext ctx, Web web, string actionTitle)
        {
            var ActionTitle = ActionTitlePrefix + "_" + actionTitle;
            var existingActions = web.UserCustomActions;
            ctx.Load(existingActions);
            ctx.ExecuteQuery();
            var actions = existingActions.ToArray();
            foreach (var action in actions)
            {
                if ((action.Description == ActionTitle && action.Location == "ScriptLink") || action.Title == actionTitle)
                {
                    action.DeleteObject();
                    ctx.ExecuteQuery();
                }
            }
        }
    }
}
