import { Parse } from "parse/node";

const sendNotification = async (request) => {
  const object = request.object;

  const Notification = Parse.Object.extend("Notification");
  const notification = new Notification({
    objectClass: object.className,
    project: object.get("project"),
  } as any);

  await notification.save();
};

Parse.Cloud.afterSave("ProjectFile", sendNotification);

Parse.Cloud.afterSave("CalendarEvent", sendNotification);

Parse.Cloud.afterSave("Transaction", sendNotification);
