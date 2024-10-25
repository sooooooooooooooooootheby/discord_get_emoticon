// 创建一个API对象，用于存储请求的URL
export const API = {
	host: "https://discord.com/api/v10",
	// 创建一个函数，用于返回emoji列表
	emojis: (guild) => `/guilds/${guild}/emojis`,
	// 创建一个函数，用于返回Sticker列表
	stickers: (guild) => `/guilds/${guild}/stickers`,
	// 创建一个函数，用于返回服务器的URL
	guilds: "/users/@me/guilds",
	guild: (id) => `/guilds/${id}`,
	// 创建一个函数，用于发起请求
	async request(method, endpoint, token) {
		return await fetch(API.host + endpoint, {
			method,
			headers: {
				Authorization: token,
			},
		});
	},
};
