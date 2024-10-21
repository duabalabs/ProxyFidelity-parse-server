import { Parse } from "parse/node";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
  S3Client,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { UploadDataProps } from "./types";

// Initialize S3 client for DigitalOcean Spaces
const s3Client = new S3Client({
  region: process.env.SPACES_REGION,
  endpoint: process.env.SPACES_ENDPOINT,
  credentials: {
    accessKeyId: process.env.SPACES_KEY,
    secretAccessKey: process.env.SPACES_SECRET,
  },
});

Parse.Cloud.define(
  "initiateMultipartUpload",
  async (request: { params: UploadDataProps }) => {
    const { fileName, fileType, projectId } = request.params;

    const Project = Parse.Object.extend("Project");
    const project = new Project();
    project.id = projectId;

    await project.fetch({ useMasterKey: true });
    const owner = project.get("owner");
    await owner.fetch({ useMasterKey: true });

    const ownerName = owner.get("email");
    const projectName = project.get("name");
    const sanitizedUsername = ownerName.replace(/[@.]/g, "_");
    const filePath = `${sanitizedUsername}/${projectName}/${fileName}`;

    const params = {
      Bucket: process.env.SPACES_BUCKET,
      Key: filePath,
      ContentType: fileType,
    };

    try {
      const command = new CreateMultipartUploadCommand(params);
      const multipartUpload = await s3Client.send(command);

      return {
        uploadId: multipartUpload.UploadId,
        filePath,
        fileUrl: `${process.env.SPACES_BASE_URL}/${filePath}`,
        cdnUrl: `${process.env.SPACES_CDN_BASE_URL}/${filePath}`,
      };
    } catch (error) {
      throw new Parse.Error(500, "Error initiating multipart upload", error);
    }
  }
);

Parse.Cloud.define(
  "generateMultipartPresignedUrl",
  async (request: { params: UploadDataProps }) => {
    const { fileName, partNumber, uploadId, projectId } = request.params;

    const Project = Parse.Object.extend("Project");
    const project = new Project();
    project.id = projectId;

    await project.fetch({ useMasterKey: true });
    const owner = project.get("owner");
    await owner.fetch({ useMasterKey: true });

    const ownerName = owner.get("email");
    const projectName = project.get("name");
    const sanitizedUsername = ownerName.replace(/[@.]/g, "_");
    const filePath = `${sanitizedUsername}/${projectName}/${fileName}`;

    const params = {
      Bucket: process.env.SPACES_BUCKET,
      Key: filePath,
      PartNumber: partNumber,
      UploadId: uploadId,
    };

    try {
      const url = await getSignedUrl(s3Client, new UploadPartCommand(params), {
        expiresIn: 1200,
      });
      return { presignedUrl: url };
    } catch (error) {
      throw new Parse.Error(
        500,
        "Error generating presigned URL for multipart upload",
        error
      );
    }
  }
);

Parse.Cloud.define(
  "completeMultipartUpload",
  async (request: { params: UploadDataProps }) => {
    const {
      fileName,
      uploadId,
      parts,
      projectId,
      fileUrl,
      cdnUrl,
      fileType,
      fileHash,
    } = request.params;

    const Project = Parse.Object.extend("Project");
    const project = new Project();
    project.id = projectId;

    await project.fetch({ useMasterKey: true });
    const owner = project.get("owner");
    await owner.fetch({ useMasterKey: true });

    const ownerName = owner.get("email");
    const projectName = project.get("name");
    const sanitizedUsername = ownerName.replace(/[@.]/g, "_");
    const filePath = `${sanitizedUsername}/${projectName}/${fileName}`;

    const params = {
      Bucket: process.env.SPACES_BUCKET,
      Key: filePath,
      MultipartUpload: { Parts: parts },
      UploadId: uploadId,
    };

    try {
      const command = new CompleteMultipartUploadCommand(params);
      const completeUpload = await s3Client.send(command);
      console.log(completeUpload);
      const ProjectFile = Parse.Object.extend("ProjectFile");
      const projectFile = new ProjectFile({
        fileUrl,
        cdnUrl,
        fileName,
        fileType,
        fileHash,
        uploadId,
        project: {
          __type: "Pointer",
          className: "Project",
          objectId: projectId,
        },
      } as any);

      await projectFile.save();
      return projectFile;
    } catch (error) {
      throw new Parse.Error(500, "Error completing multipart upload", error);
    }
  }
);

Parse.Cloud.define(
  "generateSinglePresignedUrl",
  async (request: { params: UploadDataProps }) => {
    const { fileName, fileType, projectId } = request.params;

    const Project = Parse.Object.extend("Project");
    const project = new Project();
    project.id = projectId;

    await project.fetch({ useMasterKey: true });
    const owner = project.get("owner");
    await owner.fetch({ useMasterKey: true });

    const ownerName = owner.get("email");
    const projectName = project.get("name");
    const sanitizedUsername = ownerName.replace(/[@.]/g, "_");
    const filePath = `${sanitizedUsername}/${projectName}/${fileName}`;

    const params = {
      Bucket: process.env.SPACES_BUCKET,
      Key: filePath,
      ContentType: fileType,
    };

    try {
      const command = new PutObjectCommand(params);
      const presignedUrl = await getSignedUrl(s3Client, command, {
        expiresIn: 1200,
      });
      return {
        uploadUrl: presignedUrl,
        fileUrl: `${process.env.SPACES_BASE_URL}/${fileName}`,
        cdnUrl: `${process.env.SPACES_CDN_BASE_URL}/${fileName}`,
      };
    } catch (error) {
      throw new Parse.Error(500, "Error generating presigned URL");
    }
  }
);
