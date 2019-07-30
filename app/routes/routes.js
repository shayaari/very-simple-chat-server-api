
import Message from '../model/message';
import User from '../model/user';
import LongPollingRequests from './LongPollingRequests';

var appRouter = function (app, db) {

	let longPoll = new LongPollingRequests(db);

	/**
	 * get all recent messages for starting the app
	 */
	app.get("/get", async function(req, res) {
		const { user: username } = req && req.query;

		if (! username)
			res.status(404).send('user not found.');

		let userDB = new User(db);
		let messageDB 	= new Message(db);

		let conversationList = await userDB.getConversations(username);

		// get conversation messages
		let chatList = [];
		for (let index = 0; index < conversationList.length; index++) {
			const item = conversationList[index];
			let messageList	= await messageDB.getConversationMessages(username, item.username)
			chatList.push({
				...item,
				messageList
			})
		}

		res.status(200).send(chatList);
	});

	/**
	 * long polling request to track new changes (messages)
	 */
	app.get("/waiting", function(req, res) {
		const { user, timestamp } = req && req.query;
		// send request to waiting list Array
		longPoll.addRequestToWaitingList(res, user, timestamp);
	});

	/**
	 * send message request
	 */
	app.post("/send", async function(req, res) {
		let { username, to: receiverUsername, message } = req && req.body;

		if(!(username && receiverUsername && message)) {
			res.status(404).send('invalid request');
		}

		let messageDB = new Message(db);
		let newMessage = await messageDB.add(username, receiverUsername, message);
		
		// respond to receiver user requests
		longPoll.sendRequests(receiverUsername);

		res.send(newMessage);
	});
}

module.exports = appRouter;