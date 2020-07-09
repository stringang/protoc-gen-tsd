import {
  FileDescriptorProto,
  FieldDescriptorProto,
  DescriptorProto,
  OneofDescriptorProto,
  EnumDescriptorProto,
} from 'google-protobuf/google/protobuf/descriptor_pb';
import { ProtoAbstractSyntaxTreeMap } from '../proto-ast-map';
import {
  BYTES_TYPE,
  ENUM_TYPE,
  getFieldType,
  getJsTypeName,
  getTypeName,
  MESSAGE_TYPE,
} from './field-descriptor-formatter';
import { formatEnumDescriptorProto, IEnumDescriptorProtoModel } from './enum-descriptor-formatter';
import {
  IExtensionDescriptorProtoModel,
  formatExtensionDescriptorProto,
} from './extension-descriptor-formatter';
import { IOneofDescriptorProtoModel, formatOneofProto } from './oneof-descriptor-formatter';
import {
  filePathToPseudoNamespace,
  isProto2Syntax,
  isReservedWord,
  snakeToCamel,
  uppercaseFirst,
  withinNamespaceFromExportEntry,
} from '../util';

export interface IMessageType {
  messageName: string;
  oneofGroups: FieldDescriptorProto[][];
  oneofDeclList: OneofDescriptorProto[];
  fields: IMessageFieldType[];
  nestedTypes: IMessageDescriptorProtoModel[];
  formattedEnumListStr: IEnumDescriptorProtoModel[];
  formattedOneofListStr: IOneofDescriptorProtoModel[];
  formattedExtListStr: IExtensionDescriptorProtoModel[];
}

export interface IMessageDescriptorProtoModel {
  indent: string;
  BYTES_TYPE: number;
  MESSAGE_TYPE: number;
  message: IMessageType;
}

export const DefaultMessageType = JSON.stringify({
  messageName: '',
  oneofGroups: [],
  oneofDeclList: [],
  fields: [],
  nestedTypes: [],
  formattedEnumListStr: [],
  formattedOneofListStr: [],
  formattedExtListStr: [],
} as IMessageType);

export interface IMessageFieldType {
  snakeCaseName: string;
  camelCaseName: string;
  camelUpperName: string;
  fieldObjectType: string;
  type: FieldDescriptorProto.Type;
  exportType: string;
  isMapField: boolean;
  mapFieldInfo?: IMessageMapField;
  isRepeatField: boolean;
  isOptionalValue: boolean;
  canBeUndefined: boolean;
  hasClearMethodCreated: boolean;
  hasFieldPresence: boolean;
}

export const DefaultMessageFieldType = JSON.stringify({
  snakeCaseName: '',
  camelCaseName: '',
  camelUpperName: '',
  fieldObjectType: '',
  type: undefined,
  exportType: '',
  isMapField: false,
  mapFieldInfo: undefined,
  isRepeatField: false,
  isOptionalValue: false,
  canBeUndefined: false,
  hasClearMethodCreated: false,
  hasFieldPresence: false,
} as IMessageFieldType);

export interface IMessageMapField {
  keyType: FieldDescriptorProto.Type;
  keyTypeName: string;
  valueType: FieldDescriptorProto.Type;
  valueTypeName: string;
}

function hasFieldPresence(
  field: FieldDescriptorProto,
  fileDescriptorProto: FileDescriptorProto
): boolean {
  if (field.getLabel() === FieldDescriptorProto.Label.LABEL_REPEATED) {
    return false;
  }

  if (field.hasOneofIndex()) {
    return true;
  }

  if (field.getType() === MESSAGE_TYPE) {
    return true;
  }

  return isProto2Syntax(fileDescriptorProto);
}

/**
 * convert message type(DescriptorProto)
 * @param protoFileName
 * @param exportMap
 * @param messageTypeDescriptorProto
 * @param indent
 * @param fileDescriptorProto
 */
export function formatMessageTypeDescriptorProto(
  protoFileName: string,
  exportMap: ProtoAbstractSyntaxTreeMap,
  messageTypeDescriptorProto: DescriptorProto,
  indent: string,
  fileDescriptorProto: FileDescriptorProto
): IMessageDescriptorProtoModel {
  const nextIndent = `${indent}    `;
  const messageData = JSON.parse(DefaultMessageType) as IMessageType;

  messageData.messageName = messageTypeDescriptorProto.getName();
  messageData.oneofDeclList = messageTypeDescriptorProto.getOneofDeclList();
  const messageOptions = messageTypeDescriptorProto.getOptions();
  if (messageOptions !== undefined && messageOptions.getMapEntry()) {
    // this message type is the entry tuple for a map - don't output it
    return null;
  }

  const oneofGroups: FieldDescriptorProto[][] = [];

  /** message fields */
  messageTypeDescriptorProto.getFieldList().forEach((field: FieldDescriptorProto) => {
    const fieldData = JSON.parse(DefaultMessageFieldType) as IMessageFieldType;

    // oneof type
    if (field.hasOneofIndex()) {
      const oneOfIndex = field.getOneofIndex();
      let existing = oneofGroups[oneOfIndex];
      if (existing === undefined) {
        existing = [];
        oneofGroups[oneOfIndex] = existing;
      }
      existing.push(field);
    }

    fieldData.snakeCaseName = field.getName().toLowerCase();
    fieldData.camelCaseName = snakeToCamel(fieldData.snakeCaseName);
    fieldData.camelUpperName = uppercaseFirst(fieldData.camelCaseName);
    // handle reserved keywords in field names like Javascript generator
    // see: https://github.com/google/protobuf/blob/ed4321d1cb33199984118d801956822842771e7e/src/google/protobuf/compiler/js/js_generator.cc#L508-L510
    if (isReservedWord(fieldData.camelCaseName)) {
      fieldData.camelCaseName = `pb_${fieldData.camelCaseName}`;
    }
    fieldData.type = field.getType();
    fieldData.isMapField = false;
    fieldData.canBeUndefined = false;

    let exportType;
    const fullTypeName = field.getTypeName().slice(1);

    if (fieldData.type === MESSAGE_TYPE) {
      const fieldMessageType = exportMap.getMessage(fullTypeName);
      if (fieldMessageType === undefined) {
        throw new Error('No message export for: ' + fullTypeName);
      }

      fieldData.isMapField =
        fieldMessageType.messageDescriptorOptions !== undefined &&
        fieldMessageType.messageDescriptorOptions.getMapEntry();
      if (fieldData.isMapField) {
        const mapData = {} as IMessageMapField;
        const keyTuple = fieldMessageType.mapFieldOptions!.key;
        const keyType = keyTuple[0];
        const keyTypeName = getFieldType(keyType, keyTuple[1] as string, protoFileName, exportMap);
        const valueTuple = fieldMessageType.mapFieldOptions!.value;
        const valueType = valueTuple[0];
        let valueTypeName = getFieldType(
          valueType,
          valueTuple[1] as string,
          protoFileName,
          exportMap
        );
        if (valueType === BYTES_TYPE) {
          valueTypeName = 'Uint8Array | string';
        }
        mapData.keyType = keyType;
        mapData.keyTypeName = keyTypeName;
        mapData.valueType = valueType;
        mapData.valueTypeName = valueTypeName;
        fieldData.mapFieldInfo = mapData;
        messageData.fields.push(fieldData);
        return;
      }

      const withinNamespace = withinNamespaceFromExportEntry(fullTypeName, fieldMessageType);
      if (fieldMessageType.protoFileName === protoFileName) {
        exportType = withinNamespace;
      } else {
        exportType =
          filePathToPseudoNamespace(fieldMessageType.protoFileName) + '.' + withinNamespace;
      }
      fieldData.exportType = exportType;
    } else if (fieldData.type === ENUM_TYPE) {
      const fieldEnumType = exportMap.getEnum(fullTypeName);
      if (fieldEnumType === undefined) {
        throw new Error('No enum export for: ' + fullTypeName);
      }
      const withinNamespace = withinNamespaceFromExportEntry(fullTypeName, fieldEnumType);
      if (fieldEnumType.protoFileName === protoFileName) {
        exportType = withinNamespace;
      } else {
        exportType = filePathToPseudoNamespace(fieldEnumType.protoFileName) + '.' + withinNamespace;
      }
      fieldData.exportType = exportType;
    } else {
      let type = getTypeName(fieldData.type);

      // Check for [jstype = JS_STRING] overrides
      const options = field.getOptions();
      if (options && options.hasJstype()) {
        const jstype = getJsTypeName(options.getJstype());
        if (jstype) {
          type = jstype;
        }
      }

      exportType = fieldData.exportType = type;
    }

    fieldData.isOptionalValue = field.getType() === MESSAGE_TYPE;
    fieldData.isRepeatField = field.getLabel() === FieldDescriptorProto.Label.LABEL_REPEATED;
    if (!fieldData.isRepeatField && fieldData.type !== BYTES_TYPE) {
      let fieldObjectType = exportType;
      let canBeUndefined = false;
      if (fieldData.type === MESSAGE_TYPE) {
        if (
          !isProto2Syntax(fileDescriptorProto) ||
          field.getLabel() === FieldDescriptorProto.Label.LABEL_OPTIONAL
        ) {
          canBeUndefined = true;
        }
      } else {
        if (isProto2Syntax(fileDescriptorProto)) {
          canBeUndefined = true;
        }
      }
      fieldData.fieldObjectType = fieldObjectType;
      fieldData.canBeUndefined = canBeUndefined;
    }
    fieldData.hasFieldPresence = hasFieldPresence(field, fileDescriptorProto);

    messageData.fields.push(fieldData);
  });

  /** nested message type */
  messageTypeDescriptorProto.getNestedTypeList().forEach((nestedMessage: DescriptorProto) => {
    const msgOutput = formatMessageTypeDescriptorProto(
      protoFileName,
      exportMap,
      nestedMessage,
      nextIndent,
      fileDescriptorProto
    );
    if (msgOutput !== null) {
      // If the message class is a Map entry then it isn't output, so don't print the namespace block
      messageData.nestedTypes.push(msgOutput);
    }
  });

  messageTypeDescriptorProto.getEnumTypeList().forEach((enumType: EnumDescriptorProto) => {
    messageData.formattedEnumListStr.push(formatEnumDescriptorProto(enumType, nextIndent));
  });

  messageTypeDescriptorProto
    .getOneofDeclList()
    .forEach((oneOfDecl: OneofDescriptorProto, index: number) => {
      messageData.formattedOneofListStr.push(
        formatOneofProto(oneOfDecl, oneofGroups[index] || [], nextIndent)
      );
    });

  messageTypeDescriptorProto.getExtensionList().forEach((extension: FieldDescriptorProto) => {
    messageData.formattedExtListStr.push(
      formatExtensionDescriptorProto(protoFileName, exportMap, extension, nextIndent)
    );
  });

  return {
    indent,
    BYTES_TYPE,
    MESSAGE_TYPE,
    message: messageData,
  };
}
