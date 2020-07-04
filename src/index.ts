import {
  CodeGeneratorRequest,
  CodeGeneratorResponse,
} from "google-protobuf/google/protobuf/compiler/plugin_pb";
import {replaceProtoSuffix, withAllStdIn} from "./util";
import { FileDescriptorProto } from "google-protobuf/google/protobuf/descriptor_pb";
import {ExportMap} from "./wrapper";

/**
 * This is the ProtoC compiler plugin.
 *
 * It only accepts stdin/stdout output according to the protocol
 * specified in [plugin.protos](https://github.com/google/protobuf/blob/master/src/google/protobuf/compiler/plugin.proto).
 */
withAllStdIn((inputBuff: Buffer) => {
  try {
    const typedInputBuff = new Uint8Array(inputBuff.length);
    typedInputBuff.set(inputBuff);

    const codeGenRequest = CodeGeneratorRequest.deserializeBinary(
      typedInputBuff
    );
    console.log(codeGenRequest)
    const codeGenResponse = new CodeGeneratorResponse();
    const exportMap = new ExportMap();
    const fileNameToDescriptor: { [key: string]: FileDescriptorProto } = {};

    // Generate separate `.ts` files for services if param is set
    const parameter = codeGenRequest.getParameter();
    const generateGrpcNodeServices = parameter === "service=grpc-node";

    // wrap data structure
    codeGenRequest.getProtoFileList().forEach((protoFileDescriptor: FileDescriptorProto) => {
      // @ts-ignore
      fileNameToDescriptor[protoFileDescriptor.getName()] = protoFileDescriptor;
      exportMap.addFileDescriptor(protoFileDescriptor);
    });

    codeGenRequest.getFileToGenerateList().forEach((fileName: string) => {
      // message type definition
      const outputFileName = replaceProtoSuffix(fileName);
      const messageTypeDefinitionFile = new CodeGeneratorResponse.File();
      messageTypeDefinitionFile.setName(outputFileName + ".d.ts");
      // const messageAST = ProtoMsgTsdFormatter.format(fileNameToDescriptor[fileName], exportMap);
      // messageTypeDefinitionFile.setContent(TplEngine.render("msg_tsd", msgModel));
      codeGenResponse.addFile(messageTypeDefinitionFile);

        // const file = generateGrpcNodeService(
        //   outputFileName,
        //   fileNameToDescriptor[fileName],
        //   exportMap
        // );
        // codeGenResponse.addFile(file);
    });

    process.stdout.write(Buffer.from(codeGenResponse.serializeBinary()));
  } catch (err) {
    console.error("protoc-gen-tsd error: " + err.stack + "\n");
    process.exit(1);
  }
});
