const fs = require('fs');
const path = require('path');
const saml = require('samlify');
const validator = require('@authenio/samlify-xsd-schema-validator');

saml.setSchemaValidator(validator);
let idp
if (process.env.IDP_XML) {
  idp = saml.IdentityProvider({
    metadata: process.env.IDP_XML
  });
}
const sp = saml.ServiceProvider({
  metadata: fs.readFileSync(path.join(__dirname, '../sp.xml'))
});

module.exports = { sp, idp };