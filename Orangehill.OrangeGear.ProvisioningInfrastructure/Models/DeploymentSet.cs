using System;
using System.Collections.Generic;
using System.Text;

using Microsoft.SharePoint.Client;

namespace Orangehill.OrangeGear.Infrastructure.Models
{
    public class DeploymentSet
    {
        public string Name;
        public DeploymentScope Scope;
        public List<Task> Tasks;
    }
    public enum DeploymentScope
    {
        SiteCollection,
        Web

    }
}
