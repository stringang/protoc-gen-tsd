import {
  DescriptorProto,
  EnumDescriptorProto,
  FieldDescriptorProto,
  FileDescriptorProto,
} from 'google-protobuf/google/protobuf/descriptor_pb';
import { ProtoAbstractSyntaxTreeMap } from '../proto-ast-map';
import { formatEnumDescriptorProto, IEnumDescriptorProtoModel } from './enum-descriptor-formatter';
import {
  formatExtensionDescriptorProto,
  IExtensionDescriptorProtoModel,
} from './extension-descriptor-formatter';
import {
  formatMessageTypeDescriptorProto,
  IMessageDescriptorProtoModel,
} from './message-descriptor-formatter';
import { WellKnownTypesMap } from '../wellknown';
import { DependencyFilter } from '../dependency-filter';
import { filePathFromProtoWithoutExt, filePathToPseudoNamespace, getPathToRoot } from '../util';

export interface IFileDescriptorProtoModel {
  packageName: string; // e.g. "foo.bar"
  protoFileName: string; // relative to root of source tree
  imports: string[];
  messages: IMessageDescriptorProtoModel[];
  extensions: IExtensionDescriptorProtoModel[];
  enums: IEnumDescriptorProtoModel[];
}

/**
 * build template data
 * @param fileDescriptorProto
 * @param protoAbstractSyntaxTreeMap
 * @return IFileDescriptorProtoModel
 */
export function formatFileDescriptorProto(
  fileDescriptorProto: FileDescriptorProto,
  protoAbstractSyntaxTreeMap: ProtoAbstractSyntaxTreeMap
): IFileDescriptorProtoModel {
  const protoFileName = fileDescriptorProto.getName();
  const packageName = fileDescriptorProto.getPackage();

  const imports: string[] = [];
  const messages: IMessageDescriptorProtoModel[] = [];
  const extensions: IExtensionDescriptorProtoModel[] = [];
  const enums: IEnumDescriptorProtoModel[] = [];

  // get relative to root path
  const upToRoot = getPathToRoot(protoFileName);

  /** import dependencies in the .proto file */
  fileDescriptorProto.getDependencyList().forEach((dependency: string) => {
    if (DependencyFilter.indexOf(dependency) !== -1) {
      return; // filtered
    }

    const pseudoNamespace = filePathToPseudoNamespace(dependency);

    if (!(dependency in WellKnownTypesMap)) {
      const filePath = filePathFromProtoWithoutExt(dependency);
      imports.push(`import * as ${pseudoNamespace} from "${upToRoot}${filePath}";`);
    }
  });

  /** .proto file message top-level type */
  fileDescriptorProto.getMessageTypeList().forEach((messageType: DescriptorProto) => {
    messages.push(
      formatMessageTypeDescriptorProto(
        protoFileName,
        protoAbstractSyntaxTreeMap,
        messageType,
        '',
        fileDescriptorProto
      )
    );
  });

  // .proto file enum top-level type
  fileDescriptorProto.getEnumTypeList().forEach((enumType: EnumDescriptorProto) => {
    enums.push(formatEnumDescriptorProto(enumType, ''));
  });

  return {
    packageName,
    protoFileName,
    imports,
    messages,
    extensions,
    enums,
  };
}
