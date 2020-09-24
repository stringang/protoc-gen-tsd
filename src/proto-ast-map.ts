import {
  DescriptorProto,
  EnumDescriptorProto,
  EnumOptions,
  FieldDescriptorProto,
  FileDescriptorProto,
  MessageOptions,
} from 'google-protobuf/google/protobuf/descriptor_pb';
import Type = FieldDescriptorProto.Type;

export interface IExportMessageEntry {
  protoPackage: string | undefined;
  protoFileName: string | undefined; // fully qualified file name
  messageDescriptorOptions: MessageOptions | undefined;
  mapFieldOptions?: {
    key: [Type, string]; // Type, StringTypeName
    value: [Type, string]; // Type, StringTypeName
  };
}

export interface IExportEnumEntry {
  protoPackage: string | undefined;
  protoFileName: string | undefined;
  enumDescriptorOptions: EnumOptions | undefined;
}

/**
 * protocol buffer All top-level definitions collection.
 * - message type
 * - enum type
 * - service
 * - extension
 */
export class ProtoAbstractSyntaxTreeMap {
  protected messageTypeMap: { [key: string]: IExportMessageEntry } = {};
  protected enumTypeMap: { [key: string]: IExportEnumEntry } = {};

  public exportMessage(
    packageScope: string | undefined,
    fileDescriptor: FileDescriptorProto,
    messageDescriptor: DescriptorProto
  ) {
    const messageEntry: IExportMessageEntry = {
      protoPackage: fileDescriptor.getPackage(),
      protoFileName: fileDescriptor.getName(),
      messageDescriptorOptions: messageDescriptor.getOptions(),
      mapFieldOptions:
        messageDescriptor.getOptions() && messageDescriptor.getOptions().getMapEntry()
          ? {
              key: [
                messageDescriptor.getFieldList()[0].getType(),
                messageDescriptor.getFieldList()[0].getTypeName().slice(1),
              ],
              value: [
                messageDescriptor.getFieldList()[1].getType(),
                messageDescriptor.getFieldList()[1].getTypeName().slice(1),
              ],
            }
          : undefined,
    };

    const entryName = `${packageScope ? packageScope + '.' : ''}${messageDescriptor.getName()}`;
    this.messageTypeMap[entryName] = messageEntry;

    // nested message definition
    messageDescriptor.getNestedTypeList().forEach((nestedMessageType: DescriptorProto) => {
      this.exportMessage(entryName, fileDescriptor, nestedMessageType);
    });

    // nested enum definition
    messageDescriptor.getEnumTypeList().forEach((enumType: EnumDescriptorProto) => {
      const identifier = entryName + '.' + enumType.getName();
      this.enumTypeMap[identifier] = {
        protoPackage: fileDescriptor.getPackage(),
        protoFileName: fileDescriptor.getName(),
        enumDescriptorOptions: enumType.getOptions(),
      };
    });
  }

  public addFileDescriptorProto(fileDescriptorProto: FileDescriptorProto) {
    const protoPackage = fileDescriptorProto.getPackage();
    // .proto file message top-level definition
    fileDescriptorProto.getMessageTypeList().forEach((messageDescriptor: DescriptorProto) => {
      this.exportMessage(protoPackage, fileDescriptorProto, messageDescriptor);
    });

    // .proto file enum top-level definition
    fileDescriptorProto.getEnumTypeList().forEach((enumTypeDescriptor: EnumDescriptorProto) => {
      const entryName = `${protoPackage ? protoPackage + '.' : ''}${enumTypeDescriptor.getName()}`;
      this.enumTypeMap[entryName] = {
        protoPackage: fileDescriptorProto.getPackage(),
        protoFileName: fileDescriptorProto.getName(),
        enumDescriptorOptions: enumTypeDescriptor.getOptions(),
      };
    });

    // ignore service，extension top-level definitions in the .proto file
  }

  public getMessage(key: string): IExportMessageEntry | undefined {
    return this.messageTypeMap[key];
  }

  public getEnum(key: string): IExportEnumEntry | undefined {
    return this.enumTypeMap[key];
  }
}
