'use strict';

var path = require('path');
var protobuf = require('protobufjs');

var PROTO_FILE_PATHS = [
    require.resolve('connect-protobuf-messages/OpenApiCommonMessages.proto'),
    require.resolve('connect-protobuf-messages/OpenApiMessages.proto'),
];

var OpenApiProtocol = function () {
    this.filepaths = PROTO_FILE_PATHS;
    this.builder = undefined;
    this.payloadTypes = {};
    this.names = {};
    this.messages = {};
    this.enums = {};
};

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
        clientMsgId: protoMessage.clientMsgId
    };
};

OpenApiProtocol.prototype.load = function () {
    this.filepaths.map(function (filepath) {
        this.builder = protobuf.loadProtoFile(filepath, this.builder);
    }, this);
};


OpenApiProtocol.prototype.markFileAsLoadedForImport = function (protoFile) {
    this.rootUrl = this.rootUrl || (protoFile.url.replace(/\/[^\/]*$/, '') + '/');
    this.builder.files[this.rootUrl + protoFile.name] = true;
};

OpenApiProtocol.prototype.loadFile = function (protoFile) {
    this.builder = protobuf.loadProtoFile(protoFile.url, this.builder);
    this.markFileAsLoadedForImport(protoFile);
};

OpenApiProtocol.prototype.build = function () {
    var builder = this.builder;

    builder.build();

    var messages = [];
    var enums = [];

    builder.ns.children.forEach(function (reflect) {
        var className = reflect.className;

        if (className === 'Message') {
            messages.push(reflect);
        } else if (className === 'Enum') {
            enums.push(reflect);
        }
    }, this);

    messages
        .filter(function (message) {
            return typeof this.findPayloadType(message) === 'number';
        }, this)
        .forEach(function (message) {
            var name = message.name;

            var messageBuilded = builder.build(name);

            this.messages[name] = messageBuilded;

            var payloadType = this.findPayloadType(message);

            this.names[name] = {
                messageBuilded: messageBuilded,
                payloadType: payloadType
            };
            this.payloadTypes[payloadType] = {
                messageBuilded: messageBuilded,
                name: name
            };
        }, this);

    enums
        .forEach(function (enume) {
            var name = enume.name;
            this.enums[name] = builder.build(name);
        }, this);

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
    const payload_type_keys = Object.keys(this.payloadTypes)
    
    if (!payload_type_keys.includes(String(payloadType))) {
        if (payload_type_keys.length === 0) {
            throw new Error(
                `Warning: No payload types: ${this.payloadTypes} imported from files: ${this.filenames}`
            );
        }
        
        throw new Error(`Payload type: ${payloadType} not found in files: ${this.filenames}`);
    }
}

OpenApiProtocol.prototype.errorOnNameMissing = function (name) {
    const name_keys = Object.keys(this.names)
    
    if (!name_keys.includes(name)) {
        if (name_keys.length === 0) {
            throw new Error(
                `Warning: No names: ${this.names} imported from files: ${this.filenames}`
            );
        }
        
        throw new Error(`${name} not found in files: ${this.filenames}`);
    }
}

module.exports = OpenApiProtocol;
