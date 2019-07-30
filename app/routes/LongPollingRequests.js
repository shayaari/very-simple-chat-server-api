import Message from '../model/message';
import User from '../model/user';

export default class LongPollingRequests {

	constructor(db) {
		this._db = db;
		this.waitingRequests = [];
	}

	/**
	 * automatically send requests after 60 seconds
	 */
	autoSendRequest(username, timestamp) {
		setTimeout(() => {
			this.sendRequests(username, timestamp);
		}, 60000);
	}

	/**
	 * add new request to the waiting request list
	 * @param {string} username
	 */
	addRequestToWaitingList(response, username, timestamp) {
		const waiter = {response, username, timestamp };
		this.waitingRequests.push(waiter);
		this.autoSendRequest(username, timestamp);
	}

	/**
	 * respond back to all current user requests
	 * @param {string} username
	 */
	sendRequests(username, timestamp) {

		// get all user requests 
		let usernameRequests = this.waitingRequests.filter(
			item => item.username === username
				&& (timestamp ? item.timestamp === timestamp : true)
		);

		// loop through all selected user requests
		usernameRequests.length && usernameRequests.map( async request => {
			let userDB = new User(this._db);
			let messageDB 	= new Message(this._db);
	
			let conversationList = await userDB.getConversations(username);
	
			let chatList = [];
			for (let index = 0; index < conversationList.length; index++) {
				const item = conversationList[index];
				let messageList	= await messageDB.getConversationMessages(
					username, item.username, request.timestamp
				);
				chatList.push({
					...item,
					messageList
				})
			}
	
			request.response.status(200).send(chatList);
		});

		// remove selected request from list
		usernameRequests.length && usernameRequests.forEach(
			userRequestItem => this.waitingRequests.splice(
				this.waitingRequests.findIndex(
					reqItem => reqItem.timestamp === userRequestItem.timestamp
					&& reqItem.username === userRequestItem.username
				),
				1
			)
		);

	}
}