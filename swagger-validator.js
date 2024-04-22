module.exports = function(RED) {
  const Ajv = require("ajv")
  const addFormats = require("ajv-formats")

  function SwaggerValidatorNode(config) {
      RED.nodes.createNode(this, config);
      this.name = config.name;
      this.outputCount = 3;
      this.inputCount = 1;
      this.schema = config.schema;

      var node = this;

      node.on('input', function(msg, send, done) {
          send = send || function() { node.send.apply(node, arguments) }
          done = done || function(err) { if(err)node.error(err, msg); }

          jsonSchema = {};
          jsonParseError = false;

          try {
            jsonSchema = JSON.parse(this.schema);
          } catch (err) {
            node.error(err.message);
            msg.payload = {
                "originalData": msg.payload,
                "erros": err.message
             };
             send([null, msg]);
             done(err.message);
             jsonParseError = true;
          }
          if (!jsonParseError) {
            this.log(jsonSchema);

            const ajv = new Ajv({allErrors: true}) // options can be passed, e.g. {allErrors: true}
            addFormats(ajv);
            const validate = ajv.compile(jsonSchema)
            const valid = validate(msg.payload);

            try {
              // Multiple outputs
              if (valid) {
                send([ msg , null ]);
              } else {
                msg.payload = validate.errors;
                this.log(validate.errors);
                send([ null , msg ]);
              }
            } catch (err) {
              node.error(err.message);
              msg.payload = {
                  "originalData": msg.payload,
                  "erros": err.message
              };
              send([null, msg]);
              done(err.message);
            }
          }
      });

      node.on('close', function(done) {
        doSomethingWithACallback(function() {
            done();
        });
      });
  }

  RED.nodes.registerType("swagger validator", SwaggerValidatorNode);
}