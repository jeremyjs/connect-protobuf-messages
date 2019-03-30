"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var protobufjs_1 = __importDefault(require("protobufjs"));
var VERSION_CONFIG_MAP = {
    '59': {
        resolve_names: [
            'open-api-protobuf-messages-v59/CommonMessages.proto',
            'open-api-protobuf-messages-v59/OpenApiMessages.proto',
        ],
    },
    '60': {
        resolve_names: [
            'open-api-protobuf-messages-v60/OpenApiCommonMessages.proto',
            'open-api-protobuf-messages-v60/OpenApiMessages.proto',
        ],
    },
};
var OpenApiProtocol = /** @class */ (function () {
    function OpenApiProtocol(_a) {
        var _b = (_a === void 0 ? {} : _a).version, version = _b === void 0 ? '60' : _b;
        this.version = version;
        this.version_config = VERSION_CONFIG_MAP[version];
        this.filepaths = this.version_config.resolve_names.map(require.resolve);
        this.builder = undefined;
        this.payloadTypes = {};
        this.names = {};
        this.messages = {};
        this.enums = {};
    }
    OpenApiProtocol.prototype.encode = function (payloadType, params, clientMsgId) {
        var Message = this.getMessageByPayloadType(payloadType);
        var message = new Message(params);
        return this.wrap(payloadType, message, clientMsgId).encode();
    };
    OpenApiProtocol.prototype.wrap = function (payloadType, message, clientMsgId) {
        var ProtoMessage = this.getMessageByName('ProtoMessage');
        return new ProtoMessage({
            payloadType: payloadType,
            payload: message.toBuffer(),
            clientMsgId: clientMsgId
        });
    };
    OpenApiProtocol.prototype.decode = function (buffer) {
        var ProtoMessage = this.getMessageByName('ProtoMessage');
        var protoMessage = ProtoMessage.decode(buffer);
        var payloadType = protoMessage.payloadType;
        return {
            payload: this.getMessageByPayloadType(payloadType).decode(protoMessage.payload),
            payloadType: payloadType,
            clientMsgId: protoMessage.clientMsgId,
        };
    };
    OpenApiProtocol.prototype.load = function () {
        var _this = this;
        this.filepaths.map(function (filepath) {
            _this.builder = protobufjs_1.default.loadProtoFile(filepath, _this.builder);
        });
    };
    OpenApiProtocol.prototype.markFileAsLoadedForImport = function (protoFile) {
        this.rootUrl = this.rootUrl || protoFile.url.replace(/\/[^\/]*$/, '') + '/';
        this.builder.files[this.rootUrl + protoFile.name] = true;
    };
    OpenApiProtocol.prototype.loadFile = function (protoFile) {
        this.builder = protobufjs_1.default.loadProtoFile(protoFile.url, this.builder);
        this.markFileAsLoadedForImport(protoFile);
    };
    OpenApiProtocol.prototype.build = function () {
        var _this = this;
        var builder = this.builder;
        builder.build();
        var messages = [];
        var enums = [];
        builder.ns.children.forEach(function (reflect) {
            var className = reflect.className;
            if (className === 'Message') {
                messages.push(reflect);
            }
            else if (className === 'Enum') {
                enums.push(reflect);
            }
        });
        messages
            .filter(function (message) {
            return typeof _this.findPayloadType(message) === 'number';
        })
            .forEach(function (message) {
            var name = message.name;
            var messageBuilded = builder.build(name);
            _this.messages[name] = messageBuilded;
            var payloadType = _this.findPayloadType(message);
            _this.names[name] = {
                messageBuilded: messageBuilded,
                payloadType: payloadType
            };
            _this.payloadTypes[payloadType] = {
                messageBuilded: messageBuilded,
                name: name
            };
        }, this);
        enums.forEach(function (item) {
            var name = item.name;
            enums[name] = builder.build(name);
        });
        this.buildWrapper();
    };
    OpenApiProtocol.prototype.buildWrapper = function () {
        var name = 'ProtoMessage';
        var messageBuilded = this.builder.build(name);
        this.messages[name] = messageBuilded;
        this.names[name] = {
            messageBuilded: messageBuilded,
            payloadType: undefined
        };
    };
    OpenApiProtocol.prototype.findPayloadType = function (message) {
        var field = message.children.find(function (field) {
            return field.name === 'payloadType';
        });
        if (field) {
            return field.defaultValue;
        }
    };
    OpenApiProtocol.prototype.getMessageByPayloadType = function (payloadType) {
        this.errorOnPayloadTypeMissing(payloadType);
        return this.payloadTypes[payloadType].messageBuilded;
    };
    OpenApiProtocol.prototype.getMessageByName = function (name) {
        this.errorOnNameMissing(name);
        return this.names[name].messageBuilded;
    };
    OpenApiProtocol.prototype.getPayloadTypeByName = function (name) {
        this.errorOnNameMissing(name);
        return this.names[name].payloadType;
    };
    OpenApiProtocol.prototype.errorOnPayloadTypeMissing = function (payloadType) {
        var payload_type_keys = Object.keys(this.payloadTypes);
        if (!payload_type_keys.includes(String(payloadType))) {
            if (payload_type_keys.length === 0) {
                throw new Error("Warning: No payload types: " + this.payloadTypes + " imported from files: " + this.filepaths);
            }
            throw new Error("Payload type: " + payloadType + " not found in files: " + this.filepaths);
        }
    };
    OpenApiProtocol.prototype.errorOnNameMissing = function (name) {
        var name_keys = Object.keys(this.names);
        if (!name_keys.includes(name)) {
            if (name_keys.length === 0) {
                throw new Error("Warning: No names: " + this.names + " imported from files: " + this.filepaths);
            }
            throw new Error(name + " not found in files: " + this.filepaths);
        }
    };
    return OpenApiProtocol;
}());
exports.OpenApiProtocol = OpenApiProtocol;
