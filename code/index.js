const express = require('express');
const app = express();

//values from env
const PORT = process.env.PORT || 3000;

//request
app.get('/', (req, res) => {
    res.send('<h1>Hello World!</h1>');
});

//app listening
app.listen(PORT, () => {
    console.log(`App listening at http://localhost:${PORT}`)
});