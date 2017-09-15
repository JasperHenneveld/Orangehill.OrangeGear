using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

using Newtonsoft.Json;

using Microsoft.SharePoint.Client;

using Orangehill.OrangeGear.Infrastructure.Models;

namespace Orangehill.OrangeGear.ProvisioningInfrastructure
{
    public class TaskRepository
    {
        public Task getTask(ListItem taskItem)
        {
            Task task = new GeneralTask(taskItem);
            switch (task.Type)
            {
                case TaskType.CreateWeb:
                    task = new CreateWeb(taskItem);
                    break;
                case TaskType.ProvisioningTemplateTask:
                    task = new ProvisioningTemplateTask(taskItem);
                    break;
            }
            return task;
        }
    }
}
