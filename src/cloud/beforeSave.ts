import { Parse } from "parse/node";

Parse.Cloud.beforeSave("ProjectFile", async (request) => {
  const projectFile = request.object;
  const project = projectFile.get("project");
  await project.fetch({ useMasterKey: true });
  if (project) {
    const projectACL = project.getACL();
    if (projectACL) {
      projectFile.setACL(projectACL);
    }
  }
});

Parse.Cloud.beforeSave("Event", async (request) => {
  const projectFile = request.object;
  const project = projectFile.get("project");

  if (project) {
    const projectACL = project.getACL();
    if (projectACL) {
      projectFile.setACL(projectACL);
    }
  }
});
