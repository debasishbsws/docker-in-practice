const express = require('express');
const PORT = process.env.PORT || 3000;
const app = express();

app.get('/', (req, res) => {
    res.send('<h1>Hello World!</h1>');
});



app.listen(PORT, () => {
    console.log(`App listening at http://localhost:${PORT}`)
});