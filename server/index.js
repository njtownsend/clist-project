const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const fetch = require('node-fetch');
const cheerio = require('cheerio');

const port = process.env.PORT || 8080;

const app = express();
app.use(cors());
app.use(morgan('tiny'));

function getResults(body) {
    const $ = cheerio.load(body);
    const rows = $('li.result-row');
    const results = [];

    rows.each((index, element) => {
        const result = $(element);
        const title = result.find('.result-title').text();
        const price = $(result.find('.result-price').get(0)).text();
        const imageData = result.find('a.result-image').attr('data-ids');
        let images = [];
        if (imageData) {
            const parts = imageData.split(',');
            images = parts.map((id) => {
                return `https://images.craigslist.org/${id.split(':')[1]}_300x300.jpg`;
            });
        }
        results.push({
            title,
            price,
            images
        })
    })
    return results;
};

app.get('/', (req, res) => {
    res.json({
        message: "This isn't how this works."
    });
});

app.get('/search/:location/:search_term', (req, res) => {
    const {location, search_term} = req.params;
    const url = `https://${location}.craigslist.org/search/?sort=date&query=${search_term}`;

    fetch(url)
        .then(res => res.text())
        .then(body => {
            const results = getResults(body);
            res.json({
                results
            })
        })
});

app.use((req, res, next) => {
    const error = new Error(`${req.originalUrl} not found.`);
    res.status(404);
    next(error);
});

app.use((error, req, res, next) => {
    res.status(res.statusCode || 500);
    res.json({
        message: error.message
    });
});

app.listen(port, () => {
    console.log("Listening on port 5000");
});
