using System;
using System.Collections.Generic;
using System.Text;

namespace Orangehill.OrangeGear.Infrastructure.Models
{
    public class Action
    {
        public string Name;
        public ActionType Type;
        public DeploymentSet Deployment;
    }
    public enum ActionType
    {
        NewSiteCollection,
        NewWeb
    }
}
