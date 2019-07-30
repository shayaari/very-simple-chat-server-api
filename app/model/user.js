export default class User {

	constructor(db) {
		this._db = db
	}

	/**
	 * 
	 * @param {string} username
	 * @param {numeric} startingTimestamp (for pagination return next 10 conversations)
	 */
	async getConversations(username, startingTimestamp = 9e+30) {
		const baseKey = `conversation::${username}`;
		let userList = [];
		let promise = new Promise((resolve, reject) => {
			this._db.createReadStream({
				gte: baseKey,
				lte: `${baseKey}~`
			}).on('data', async (data) => {
				let username = data['key'].toString().split("::")[2];
				let lastUpdatedDate = data['value'].toString();
				// add current message to conversation array
				if(startingTimestamp > lastUpdatedDate && userList.length <= 10) {
						userList.push({
						lastUpdatedDate,
						username
					});
				}
			}).on('end', () => {
				resolve(userList);
			});
		});
		// return last 10 most recent conversations
		return await promise;;
	}

}