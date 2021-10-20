const path_mod = require('path');



//module.exports = path_mod.dirname(process.mainModule.filename);
module.exports = path_mod.dirname(require.main.filename);