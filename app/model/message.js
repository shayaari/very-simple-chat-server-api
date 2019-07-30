import utilities from '../utl';

export default class Message {

	constructor(db) {
		this._db = db
	}

	/**
	 * add new message to database
	 * @param {string} senderUserName
	 * @param {string} receiverUserName
	 * @param {string} content
	 */
	add(sender, receiver, content) {
		this._timestamp	= Date.now();
		this._sender	= sender;
		this._receiver	= receiver;

		this._generateId(sender);

		// link message to users
		this._setMap(sender, receiver);
		this._setMap(receiver, sender);

		// update last updated date on users conversation
		this._updateConversationTimestamp(sender, receiver);
		this._updateConversationTimestamp(receiver, sender);

		this._insertMessage(content);

		return {
			id: this.messageId,
			timestamp: this._timestamp,
			content,
			from: sender,
			to: receiver,
		}
	}

	/**
	 * 
	 * @param {string} fromUserName
	 * @param {string} toUserName
	 * @param {numeric} startingMessageId (use for pagination return next 10 messages)
	 */
	async getConversationMessages(fromUserName, toUserName, startingTimestamp = 0, startingMessageId = 9e+30) {
		const baseKey = `map::${fromUserName}::${toUserName}::`;
		let conversationList = [];
		let promise = new Promise((resolve, reject) => {
			this._db.createValueStream({
				gte: baseKey,
				lte: `${baseKey}~`,
				reverse: true,
				limit: 50,
			}).on('data', async (data) => {
				let messageId = data.toString();
				// add current message to conversation array
				if(startingMessageId > messageId) {
					conversationList.push({
						id: messageId
					});
				}
			}).on('end', () => {
				resolve(conversationList);
			});
			
		});
		// return results
		await promise;

		
		let conversationMessages = []
		
		// get each message details
		for (let index = 0; index < conversationList.length; index++) {
			const item = conversationList[index];
			let messageId = item.id;
			let messageObject = {
				id: 		messageId,
				content:	await this._getContent(messageId),
				timestamp:	await this._getTimestamp(messageId),
				from:		await this._getSenderUsername(messageId),
				to:			await this._getReceiverUserName(messageId)
			};
			if( startingTimestamp < messageObject.timestamp) {
				conversationMessages.push(messageObject);
			}
		}

		// return last 50 message of conversation
		return conversationMessages;
	}


	/**
	 * generate message id
	 */
	_generateId(sender) {
		this._hashCode	= utilities.hashCode(sender);
		this.messageId = this._timestamp + this._hashCode;
	}

	/**
	 * link message to users in key value database
	 * @param {stirng} userOne
	 * @param {stirng} userTwo
	 */
	_setMap(userOne, userTwo) {
		this._db.put(
			`map::${userOne}::${userTwo}::${this.messageId}`,
			this.messageId,
			(err) => {
				// some kind of I/O error
				if (err) return console.log('Ooops!', err)
			},
		);
	}

	_updateConversationTimestamp(userOne, userTwo) {
		this._db.put(
			`conversation::${userOne}::${userTwo}`,
			this._timestamp,
			(err) => {
				// some kind of I/O error
				if (err) return console.log('Ooops!', err)
			},
		);
	}

	/**
	 * insert message details to database
	 * @param {string} content
	 */
	_insertMessage(content) {
		const messageBaseKey = `message::${this.messageId}`;

		
		// insert message content
		this._db.put(
			`${messageBaseKey}::content`, content,
			(err) => {
				// some kind of I/O error
				if (err) return console.log('Ooops!', err)
			},
		);

		// insert message timestamp
		this._db.put(
			`${messageBaseKey}::timestamp`, this._timestamp,
			(err) => {
				// some kind of I/O error
				if (err) return console.log('Ooops!', err)
			},
		);

		// insert message sender
		this._db.put(
			`${messageBaseKey}::from`, this._sender,
			(err) => {
				// some kind of I/O error
				if (err) return console.log('Ooops!', err)
			},
		);

		// insert message receiver
		this._db.put(
			`${messageBaseKey}::to`, this._receiver,
			(err) => {
				// some kind of I/O error
				if (err) return console.log('Ooops!', err)
			},
		);
	}

	async _getContent(messageId) {
		let promise = new Promise((resolve, reject) => {
			this._db.get(`message::${messageId}::content`, function (err, value) {
				resolve(value.toString());
			})
		});
		return await promise;
	}
	
	async _getTimestamp(messageId) {
		let promise = new Promise((resolve, reject) => {
			this._db.get(`message::${messageId}::timestamp`, function (err, value) {
				resolve(value.toString());
			})
		});
		return await promise;
	}
	
	async _getSenderUsername(messageId) {
		let promise = new Promise((resolve, reject) => {
			this._db.get(`message::${messageId}::from`, function (err, value) {
				resolve(value.toString());
			})
		});
		return await promise;
	}
	
	async _getReceiverUserName(messageId) {
		let promise = new Promise((resolve, reject) => {
			this._db.get(`message::${messageId}::to`, function (err, value) {
				resolve(value.toString());
			})
		});
		return await promise;
	}
}