import express from 'express';
import bodyParser from 'body-parser';
import levelup from 'levelup';
import leveldown from 'leveldown';
import routes from './app/routes/routes.js';

const app = express();

// Create messages store
const db = levelup(leveldown('MESSAGE_DB'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use((req, res, next) => {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
	next();
});

routes(app, db);

const server = app.listen(3000, '0.0.0.0', function () {
	console.log("app running on port.", server.address().port);
});