const express = require("express");
const bodyParser = require("body-parser");
const { detectIntent } = require("./routes/intent");

const app = express();

app.use(bodyParser.json());

app.use("/intent", detectIntent);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
