using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

using Newtonsoft.Json;

using Microsoft.SharePoint.Client;

namespace Orangehill.OrangeGear.Infrastructure.Models
{
    public abstract class Task
    {
        public string Name;
        public TaskType Type;
        public Dictionary<string, string> Parameters;
        public string Settings;

        public Task()
        {
        }
        public Task(ListItem taskItem)
        {
            Name = (string)taskItem["Name"];
            string typeStr = (string)taskItem["Type"];
            TaskType type = new TaskType();
            if(Enum.TryParse<TaskType>(typeStr, out type))
            {
                Type = type;
            }
            string JsonParameters = (string)taskItem["JsonParameters"];
            Parameters = JsonConvert.DeserializeObject<Dictionary<string, string>>(JsonParameters);
            Settings = (string)taskItem["Settings"];
        }
    }

    public enum TaskType
    {
        ProvisioningTemplateTask,
        CreateWeb
    }

    public class GeneralTask : Task
    {
        public GeneralTask(ListItem taskItem) : base(taskItem)
        {
        }
    }
    public class ProvisioningTemplateTask : Task
    {
        public string TemplateUrl;
        public Dictionary<string, string> ProvisioningParameters = new Dictionary<string, string>();
        public ProvisioningTemplateTask(ListItem taskItem):base(taskItem)
        {
            string value = string.Empty;
            if(Parameters.TryGetValue("ProvisioningParameters", out value))
                ProvisioningParameters = JsonConvert.DeserializeObject<Dictionary<string, string>>(value);

            value = string.Empty;
            if (Parameters.TryGetValue("TemplateUrl", out value))
                TemplateUrl = JsonConvert.DeserializeObject<string>(value);
        }
    }
    public class CreateWeb : Task
    {

        //public Dictionary<string, string> Parameters;
        public CreateWeb(ListItem taskItem) : base(taskItem)
        {
            //Parameters = JsonConvert.DeserializeObject<Dictionary<string, string>>(JsonParameters);
        }
    }
}
