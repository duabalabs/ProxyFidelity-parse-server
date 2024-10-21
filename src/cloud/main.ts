import { Parse } from "parse/node";
import "./file-actions";
import "./beforeSave";

Parse.Cloud.define("hello", (request: Parse.Cloud.FunctionRequest) => {
  return "Hello world!";
});
