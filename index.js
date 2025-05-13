const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const jwt = require("jsonwebtoken");
const port = process.env.PORT || 5000;
require("dotenv").config();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
	res.send("Hello from Miah Kitchen server");
});

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.ubvegtf.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
	serverApi: {
		version: ServerApiVersion.v1,
		strict: true,
		deprecationErrors: true,
	},
});

// to check jwt token got from the client side
function verifyJWT(req, res, next) {
	const authHeader = req.headers.authorization;

	if (!authHeader) {
		return res.status(401).send({ message: "Unauthorized access" });
	}

	const token = authHeader.split(" ")[1];
	jwt.verify(token, process.env.ACCESS_SECRET_TOKEN, function (err, decoded) {
		if (err) {
			return res.status(403).send({ message: "Forbidden access" });
		}

		req.decoded = decoded;
		next();
	});
}

async function run() {
	try {
		const serviceCollection = client
			.db("miahKitchen")
			.collection("services");
		const cateringDataCollection = client
			.db("miahKitchen")
			.collection("cateringData");
		const reviewCollection = client.db("miahKitchen").collection("reviews");
		const orderCollection = client.db("miahKitchen").collection("orders");

		// to create jwt token
		app.post("/jwt", (req, res) => {
			const user = req.body;
			const token = jwt.sign(user, process.env.ACCESS_SECRET_TOKEN, {
				expiresIn: "1d",
			});
			res.send({ token });
		});

		// ************* SERVICES *************

		// to get limit food services data
		app.get("/service", async (rew, res) => {
			const query = {};
			const cursor = serviceCollection.find(query);
			const services = await cursor.limit(3).toArray();
			res.send(services);
		});

		// to get all foods service data
		app.get("/services", async (req, res) => {
			const query = {};
			const cursor = serviceCollection.find(query);
			const services = await cursor.toArray();
			res.send(services);
		});

		// to get individual food service
		app.get("/services/:id", async (req, res) => {
			const id = req.params.id;
			const query = { _id: new ObjectId(id) };
			const service = await serviceCollection.findOne(query);
			res.send(service);
		});

		// to get catering service data
		app.get("/cateringData", async (req, res) => {
			const query = {};
			const cursor = cateringDataCollection.find(query);
			const data = await cursor.toArray();
			res.send(data);
		});

		// ************ REVIEWS ************

		// to send all reviews data to the database
		app.post("/reviews", async (req, res) => {
			const query = req.body;
			const reviews = await reviewCollection.insertOne(query);
			res.send(reviews);
		});

		// to get all reviews data from database
		app.get("/reviews", async (req, res) => {
			const query = {};
			const cursor = reviewCollection.find(query);
			const allReviews = await cursor.toArray();
			res.send(allReviews);
		});

		// to get review data using email form database
		app.get("/review", verifyJWT, async (req, res) => {
			const decoded = req.decoded;
			if (decoded.email !== req.query.email) {
				res.status(403).send({ message: "unauthorized access" });
			}

			let query = {};

			if (req.query.email) {
				query = {
					email: req.query.email,
				};
			}

			const cursor = reviewCollection.find(query);
			const result = await cursor.toArray();
			res.send(result);
		});

		// to get invidual review from the database
		app.get("/review/:id", async (req, res) => {
			const id = req.params.id;
			const query = { _id: new ObjectId(id) };
			const result = await reviewCollection.findOne(query);
			res.send(result);
		});

		// to delete individual review from the database
		app.delete("/review/:id", async (req, res) => {
			const id = req.params.id;
			console.log(id);
			const query = { _id: new ObjectId(id) };
			const result = await reviewCollection.deleteOne(query);
			res.send(result);
		});

		// ************ ORDERS ************

		// to send order to the database
		app.post("/orders", async (req, res) => {
			const query = req.body;
			const result = await orderCollection.insertOne(query);
			res.send(result);
		});

		// to get individual order using email id from the database
		app.get("/orders", verifyJWT, async (req, res) => {
			const decoded = req.decoded;
			if (decoded.email !== req.query.email) {
				res.status(403).send({ message: "unauthorized access" });
			}

			let query = {};

			if (req.query.email) {
				query = {
					email: req.query.email,
				};
			}

			const cursor = orderCollection.find(query);
			const result = await cursor.toArray();
			res.send(result);
		});
	} finally {
		// Ensures that the client will close when you finish/error
	}
}
run().catch((err) => console.error(err));

app.listen(port, () => {
	console.log(`Miah Kitchen server running on: ${port}`);
});
