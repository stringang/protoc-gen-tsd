import {
  DescriptorProto, EnumDescriptorProto,
  EnumOptions,
  FieldDescriptorProto,
  FileDescriptorProto,
  MessageOptions,
} from "google-protobuf/google/protobuf/descriptor_pb";
import Type = FieldDescriptorProto.Type;

export interface IExportMessageEntry {
  protoPackage: string | undefined;
  protoFileName: string | undefined;
  messageDescriptorOptions: MessageOptions | undefined;
  mapFieldOptions?: {
    key: [Type, string],    // Type, StringTypeName
    value: [Type, string],  // Type, StringTypeName
  };
}

export interface IExportEnumEntry {
  protoPackage: string | undefined;
  protoFileName: string | undefined;
  enumDescriptorOptions: EnumOptions | undefined;
}

export class ProtoAbstractSyntaxTreeMap {
  protected messageTypeMap: { [key: string]: IExportMessageEntry } = {};
  protected enumTypeMap: { [key: string]: IExportEnumEntry } = {};

  public exportMessage(packageScope: string | undefined, fileDescriptor: FileDescriptorProto, messageType: DescriptorProto) {
    const messageEntry: IExportMessageEntry = {
      protoPackage: fileDescriptor.getPackage(),
      protoFileName: fileDescriptor.getName(),
      messageDescriptorOptions: messageType.getOptions(),
      mapFieldOptions: messageType.getOptions() && messageType.getOptions().getMapEntry() ? {
        key: [messageType.getFieldList()[0].getType(), messageType.getFieldList()[0].getTypeName().slice(1)],
        value: [messageType.getFieldList()[1].getType(), messageType.getFieldList()[1].getTypeName().slice(1)],
      } : undefined,
    };

    const entryName = `${packageScope ? packageScope + "." : ""}${messageType.getName()}`;
    this.messageTypeMap[entryName] = messageEntry;

    // nested message
    messageType.getNestedTypeList().forEach((nestedMessageType: DescriptorProto) => {
      this.exportMessage(entryName, fileDescriptor, nestedMessageType);
    });

    // nested enum
    messageType.getEnumTypeList().forEach((enumType: EnumDescriptorProto) => {
      const identifier = entryName + "." + enumType.getName();
      this.enumTypeMap[identifier] = {
        protoPackage: fileDescriptor.getPackage(),
        protoFileName: fileDescriptor.getName(),
        enumDescriptorOptions: enumType.getOptions(),
      };
    });
  }

  public addFileDescriptor(fileDescriptor: FileDescriptorProto) {
    const protoPackage = fileDescriptor.getPackage();
    // proto top-level message
    fileDescriptor.getMessageTypeList().forEach((messageType: DescriptorProto) => {
      this.exportMessage(protoPackage, fileDescriptor, messageType);
    });

    // proto top-level enum
    fileDescriptor.getEnumTypeList().forEach((enumType: EnumDescriptorProto) => {
      const entryName = `${protoPackage ? protoPackage + "." : ""}${enumType.getName()}`;
      this.enumTypeMap[entryName] = {
        protoPackage: fileDescriptor.getPackage(),
        protoFileName: fileDescriptor.getName(),
        enumDescriptorOptions: enumType.getOptions(),
      };
    });
  }

  public getMessage(key: string): IExportMessageEntry | undefined {
    return this.messageTypeMap[key];
  }

  public getEnum(key: string): IExportEnumEntry | undefined {
    return this.enumTypeMap[key];
  }
}
