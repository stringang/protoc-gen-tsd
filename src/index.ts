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
import * as prettier from 'prettier';

/**
 * This is the Protocol compiler(protoc) plugin.
 *
 * It only accepts stdin/stdout output according to the protocol
 * specified in [plugin.protos](https://github.com/google/protobuf/blob/master/src/google/protobuf/compiler/plugin.proto).
 *
 * https://github.com/improbable-eng/ts-protoc-gen
 */
withAllStdIn((inputBuffer: Buffer) => {
  try {
    const typedInputBuffer = new Uint8Array(inputBuffer.length);
    typedInputBuffer.set(inputBuffer);

    const codeGenRequest = CodeGeneratorRequest.deserializeBinary(typedInputBuffer);
    // plugin output data format
    const codeGenResponse = new CodeGeneratorResponse();
    const protoAbstractSyntaxTreeMap = new ProtoAbstractSyntaxTreeMap();
    const fileNameToDescriptor: { [key: string]: FileDescriptorProto } = {};

    // all top-level definition collection. include import .proto file
    codeGenRequest.getProtoFileList().forEach((fileDescriptorProto: FileDescriptorProto) => {
      fileNameToDescriptor[fileDescriptorProto.getName()] = fileDescriptorProto;
      protoAbstractSyntaxTreeMap.addFileDescriptorProto(fileDescriptorProto);
    });

    // generate .d.ts type file. traversal generate file list
    codeGenRequest.getFileToGenerateList().forEach((fullyQualifiedFileName: string) => {
      // message type definition
      const outputFileName = replaceProtoSuffix(fullyQualifiedFileName);
      const messageTypeDefinitionFile = new CodeGeneratorResponse.File();
      messageTypeDefinitionFile.setName(outputFileName + '.d.ts');

      const messageProtoModel: IFileDescriptorProtoModel = formatFileDescriptorProto(
        fileNameToDescriptor[fullyQualifiedFileName],
        protoAbstractSyntaxTreeMap
      );

      let content = renderTemplate('proto-tsd.tmpl', messageProtoModel);
      content = prettier.format(content, { singleQuote: true, parser: 'typescript' });
      messageTypeDefinitionFile.setContent(content);
      codeGenResponse.addFile(messageTypeDefinitionFile);

      // todo generate RPC service type file
    });

    process.stdout.write(Buffer.from(codeGenResponse.serializeBinary()));
  } catch (err) {
    console.error('protoc-gen-tsd error: ' + err.stack + '\n');
    process.exit(1);
  }
});
