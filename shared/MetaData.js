const { JsonSerializer } = require("rsocket-core");

class MetaData extends Map {

    constructor(json) {
        super();
        if (json != null) {
            for (let [key, value] of Object.entries(json)) {
                this.set(key, value);
            }
        }
    }

    toJSON() {
        const result = {};
        for (let [key, value] of this.entries()) {
            result[key] = value;
        }
        return result;
    }

}
MetaData.ROUTE = "route";
MetaData.AUTHENTICATION_BEARER = "message/x.rsocket.authentication.bearer.v0";

const JsonMetadataSerializer = {

    deserialize(data) {
        if (data == null) {
            return null;
        }
        let json = JsonSerializer.deserialize(data);
        return new Metadata(json);
    },

    serialize(metadata) {
        if (metadata == null) {
            return null;
        }
        let json = metadata.toJSON();
        return JsonSerializer.serialize(json);
    }

};
JsonMetadataSerializer.MIME_TYPE = "application/json";

module.exports = {
    MetaData,
    JsonMetadataSerializer
};