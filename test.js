import test from 'ava';
import ProtobufMessages from './index';

test(t => {
    const
        protobufMessages = new ProtobufMessages([
            {
                file: 'src/main/protobuf/CommonMessages.proto',
                protoPayloadType: 'ProtoPayloadType'
            },
            {
                file: 'src/main/protobuf/OpenApiMessages.proto',
                protoPayloadType: 'ProtoOAPayloadType'
            }
        ]);

    protobufMessages.load();
    protobufMessages.build();

    const
        ProtoHeartbeatEvent = protobufMessages.getMessageByName('ProtoHeartbeatEvent'),
        protoPingReq = new ProtoHeartbeatEvent(),
        clientMsgId = 'test',
        payloadType = 51;

    t.deepEqual(
        protobufMessages.decode(
            protobufMessages.encode(payloadType, protoPingReq, clientMsgId)
        ).payload.payloadType,
        payloadType
    );
});
