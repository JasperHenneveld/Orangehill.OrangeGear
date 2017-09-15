using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

using Newtonsoft.Json;

using Microsoft.SharePoint.Client;

using Orangehill.OrangeGear.Infrastructure.Models;

namespace Orangehill.OrangeGear.ProvisioningInfrastructure
{
    public interface ITaskRepository
    {
        Task getTask<Ttask>(ListItem taskItem);
            //where Ttask : Task;
        //ProvisioningTemplateTask getTask<Ttask>(ListItem taskItem)
        //    where Ttask : ProvisioningTemplateTask;
    }
}
