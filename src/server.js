const app = require('./expressApp');
const config = require('./config/config');

app.listen(config.port, () => {
  console.log(`Servidor en http://localhost:${config.port}`);
});
