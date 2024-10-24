import { Parse } from "parse/node";

const setProjectACLForObjects = async (request) => {
  const object = request.object;
  const project = object.get("project");
  await project.fetch({ useMasterKey: true });

  if (project) {
    const projectACL = project.getACL();
    if (projectACL) {
      object.setACL(projectACL);
    }
  }
};

Parse.Cloud.beforeSave("ProjectFile", setProjectACLForObjects);

Parse.Cloud.beforeSave("CalendarEvent", setProjectACLForObjects);

Parse.Cloud.beforeSave("Transaction", setProjectACLForObjects);

Parse.Cloud.beforeSave("Notification", setProjectACLForObjects);
