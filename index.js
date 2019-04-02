"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var protobufjs_1 = __importStar(require("protobufjs"));
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
        this.payloadTypes = {};
        this.names = {};
        this.messages = {};
        this.enums = {};
        this.namespace_root = new protobufjs_1.Root();
    }
    OpenApiProtocol.prototype.encode = function (payload_name, params, client_msg_id) {
        var TypeClass = this.getClassByName(payload_name);
        var payload_type = this.getTypeByClass(TypeClass);
        TypeClass.verify(params);
        var ProtoMessage = this.getClassByName('ProtoMessage');
        return ProtoMessage.create({
            payloadType: payload_type,
            payload: TypeClass.encode(params).finish(),
            clientMsgId: client_msg_id
        });
    };
    OpenApiProtocol.prototype.decode = function (buffer) {
        var ProtoMessageClass = this.getClassByName('ProtoMessage');
        var proto_message = ProtoMessageClass.decode(buffer);
        var payload_type = proto_message.payloadType;
        var TypeClass = this.getClassbyType(payload_type);
        var payload = TypeClass.decode(proto_message.payload);
        return {
            payloadType: payload_type,
            payload: payload,
            clientMsgId: proto_message.clientMsgId,
        };
    };
    OpenApiProtocol.prototype.load = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, Promise.all(this.filepaths.map(function (filepath) { return __awaiter(_this, void 0, void 0, function () {
                            var root;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, protobufjs_1.default.load(filepath)];
                                    case 1:
                                        root = _a.sent();
                                        this.namespace_root = protobufjs_1.Root.fromJSON(Object.assign({}, this.namespace_root, root.toJSON()));
                                        return [2 /*return*/];
                                }
                            });
                        }); }))
                            .catch(console.error)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    // TODO: lookupEnum
    OpenApiProtocol.prototype.getClassByName = function (name) {
        // if (name_keys.length === 0) {
        //   throw new Error(
        //     `Warning: No names: ${this.names} imported from files: ${this.filepaths}`
        //   )
        // }
        try {
            return this.namespace_root.lookupType(name);
        }
        catch (e) {
            if (e.message.includes('no such type')) {
                throw new Error("type `" + name + "` not found in files:\n" +
                    this.version_config.resolve_names.join('\n'));
            }
            else {
                throw e;
            }
        }
    };
    OpenApiProtocol.prototype.getTypeByClass = function (TypeClass) {
        var PayloadTypeEnum = this.namespace_root.lookupEnum('ProtoOAPayloadType');
        console.log(PayloadTypeEnum);
        return 0;
    };
    OpenApiProtocol.prototype.getClassbyType = function (payload_type) {
        var PayloadTypeEnum = this.namespace_root.lookupEnum('ProtoOAPayloadType');
        console.log(PayloadTypeEnum);
        return this.namespace_root.lookupType('ProtoMessage');
    };
    return OpenApiProtocol;
}());
exports.OpenApiProtocol = OpenApiProtocol;
// try {
//   const main = async () => {
//     const protocol = new OpenApiProtocol({ version: '60' })
//     await protocol.load()
//     const message_1 = protocol.getClassByName('ProtoOAApplicationAuthReq')
//     console.log('message_1:', message_1)
//     const message = protocol.getClassByName('foobar')
//   }
//   main().then(() => process.exit(0)).catch(console.error)
// } catch (e) {
//   console.error(e)
// }
