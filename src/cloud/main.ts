import { Parse } from "parse/node";
import './fileUpload'
import './beforeSave'

Parse.Cloud.define("hello", (request: Parse.Cloud.FunctionRequest) => {
  return "Hello world!";
});
