const express = require('express');
const bodyParser = require('body-parser');
const ussdRoutes = require('./routes/ussd');

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// ✅ Mount /ussd routes
app.use('/ussd', ussdRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`ProBank USSD server running on port ${PORT}`);
});
