import express from "express";

const app = express();

app.get("/", (req, res) => {
  res.status(200).send("Hello World!");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
