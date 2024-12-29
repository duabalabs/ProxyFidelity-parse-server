import { Parse } from "parse/node";

Parse.Cloud.define("requestProject", async (request) => {
  const {
    fullName,
    email,
    phoneNumber,
    companyName,
    projectName,
    projectDescription,
  } = request.params;

  if (!email) {
    throw new Parse.Error(400, "Email is required");
  }

  // Check if a project request with this email already exists
  const query = new Parse.Query("ProjectRequest");
  query.equalTo("email", email);

  try {
    const existingRequest = await query.first();

    if (existingRequest) {
      // If a request with the given email already exists, return an error
      throw new Parse.Error(
        400,
        "Project request with this email already exists"
      );
    }

    // If no existing request, create a new entry in the ProjectRequest table
    const ProjectRequest = Parse.Object.extend("ProjectRequest");
    const newRequest = new ProjectRequest();

    newRequest.set("fullName", fullName);
    newRequest.set("email", email);
    newRequest.set("phoneNumber", phoneNumber);
    newRequest.set("companyName", companyName);
    newRequest.set("projectName", projectName);
    newRequest.set("projectDescription", projectDescription);

    const savedRequest = await newRequest.save();
    return savedRequest;
  } catch (error) {
    console.error("Error in requestProject:", error);
    throw new Parse.Error(500, "Unable to create project request at this time");
  }
});

const crypto = require("crypto");

Parse.Cloud.define("acceptProject", async (request) => {
  const { projectId } = request.params;

  if (!projectId) {
    throw new Parse.Error(400, "ProjectRequest projectId is required");
  }

  const ProjectRequest = Parse.Object.extend("ProjectRequest");
  const query = new Parse.Query(ProjectRequest);

  try {
    // Find the existing project request
    const projectRequest = await query.get(projectId);
    if (!projectRequest) {
      throw new Parse.Error(404, "Project request not found");
    }

    // Generate a random password
    const password = crypto.randomBytes(8).toString("hex");

    // Create a new user
    const user = new Parse.User();
    user.set("username", projectRequest.get("email"));
    user.set("email", projectRequest.get("email"));
    user.set("password", password);

    const savedUser = await user.signUp();

    // Assign the user to the client role
    const roleQuery = new Parse.Query(Parse.Role);
    roleQuery.equalTo("name", "client");
    const clientRole = await roleQuery.first();

    if (clientRole) {
      clientRole.getUsers().add(savedUser);
      await clientRole.save();
    }

    // Create a new project
    const Project = Parse.Object.extend("Project");
    const project = new Project();
    project.set("fullName", projectRequest.get("fullName"));
    project.set("email", projectRequest.get("email"));
    project.set("phoneNumber", projectRequest.get("phoneNumber"));
    project.set("companyName", projectRequest.get("companyName"));
    project.set("projectName", projectRequest.get("projectName"));
    project.set("projectDescription", projectRequest.get("projectDescription"));
    project.set("owner", savedUser);

    // Set ACL: Allow only the user and admin role access
    const adminRoleQuery = new Parse.Query(Parse.Role);
    adminRoleQuery.equalTo("name", "admin");
    const adminRole = await adminRoleQuery.first();

    if (!adminRole) {
      throw new Parse.Error(500, "Admin role not found");
    }

    const projectACL = new Parse.ACL();
    projectACL.setReadAccess(savedUser, true);
    projectACL.setWriteAccess(savedUser, true);
    projectACL.setRoleReadAccess(adminRole, true);
    projectACL.setRoleWriteAccess(adminRole, true);
    project.setACL(projectACL);

    const savedProject = await project.save();

    // Send email to user with login credentials and project info
    //     await Parse.Cloud.run("sendEmail", {
    //       to: projectRequest.get("email"),
    //       subject: "Project Created - Login Information",
    //       text: `Hello ${projectRequest.get("fullName")},

    // Your project "${projectRequest.get("projectName")}" has been successfully created!

    // Here are your login details:
    // Username: ${projectRequest.get("email")}
    // Password: ${password}

    // Please login to your dashboard to start tracking your project.

    // Best regards,
    // The Team`,
    //     });

    return {
      success: true,
      message: "Project created and user notified via email",
      project: savedProject,
    };
  } catch (error) {
    console.error("Error in acceptProject:", error);
    throw new Parse.Error(500, "Unable to accept project request at this time");
  }
});
