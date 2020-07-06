import {
  CodeGeneratorRequest,
  CodeGeneratorResponse,
} from 'google-protobuf/google/protobuf/compiler/plugin_pb';
import { replaceProtoSuffix, withAllStdIn } from './util';
import { FileDescriptorProto } from 'google-protobuf/google/protobuf/descriptor_pb';
import { ProtoAbstractSyntaxTreeMap } from './proto-ast-map';
import {
  formatFileDescriptorProto,
  IFileDescriptorProtoModel,
} from './format/file-descriptor-formatter';
import { renderTemplate } from './tmpl-engine';

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

    const codeGenRequest = CodeGeneratorRequest.deserializeBinary(typedInputBuff);
    const codeGenResponse = new CodeGeneratorResponse();
    const protoAbstractSyntaxTreeMap = new ProtoAbstractSyntaxTreeMap();
    const fileNameToDescriptor: { [key: string]: FileDescriptorProto } = {};

    // Generate separate `.ts` files for services if param is set
    const parameter = codeGenRequest.getParameter();
    const generateGrpcNodeServices = parameter === 'service=grpc-node';

    // wrap proto abstract syntax tree structure
    codeGenRequest.getProtoFileList().forEach((protoFileDescriptor: FileDescriptorProto) => {
      fileNameToDescriptor[protoFileDescriptor.getName()] = protoFileDescriptor;
      protoAbstractSyntaxTreeMap.addFileDescriptor(protoFileDescriptor);
    });

    // generate .d.ts type file
    codeGenRequest.getFileToGenerateList().forEach((fileName: string) => {
      // message type definition
      const outputFileName = replaceProtoSuffix(fileName);
      const messageTypeDefinitionFile = new CodeGeneratorResponse.File();
      messageTypeDefinitionFile.setName(outputFileName + '.d.ts');

      const messageProtoModel: IFileDescriptorProtoModel = formatFileDescriptorProto(
        fileNameToDescriptor[fileName],
        protoAbstractSyntaxTreeMap
      );
      console.log(messageProtoModel);
      messageTypeDefinitionFile.setContent(renderTemplate('message-tsd.tmpl', messageProtoModel));
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
    console.error('protoc-gen-tsd error: ' + err.stack + '\n');
    process.exit(1);
  }
});
