<template>
	<div class="main">
		<div class="form">
			<el-card shadow="never">
				<span class="title">警告: 小心, 共享您的用户令牌可能是危险的!</span>
				<p>这个页面不会以任何有害的方式使用你的用户令牌, 只使用它来与Discord进行身份验证, 获取你的服务器列表和他们的表情符号。</p>
			</el-card>
			<div class="bar">
				<el-input class="input" v-model="token" placeholder="在这里输入你的token" clearable />
				<el-button color="#5865F2" plain @click="dialogVisible = true"> token是什么 </el-button>
				<el-button color="#5865F2" plain @click="submit"> 提交 </el-button>
				<el-checkbox class="checkbox" v-model="isSave" label="记住你的令牌" size="large" />
			</div>

			<el-dialog v-model="dialogVisible" title="如何获取用户令牌" align-center>
				<ol>
					<li>打开Discord桌面应用程序或登录Discord网站</li>
					<li>用键盘快捷键打开Chrome开发工具</li>
					<li>F12 or Ctrl + Shift + I</li>
					<li>转到网络选项卡</li>
					<li>单击XHR按钮, 只过滤到XHR请求</li>
					<li>在Discord中做任何动作, 比如打开一个频道</li>
					<li>点击列表中出现的science请求</li>
					<li>转到Headers选项卡</li>
					<li>在Request Headers下找到授权并复制令牌(确保复制整个令牌，不要复制任何空格)</li>
				</ol>
				<img src="/discordTokenHint.jpg" alt="token提示" />
			</el-dialog>
		</div>

		<div class="list">
			<div class="serverList" v-if="serverLoad">
				<el-table ref="singleTableRef" :data="serverList" highlight-current-row height="400" style="width: auto" @current-change="handleCurrentChange">
					<el-table-column type="index" width="50" />
					<el-table-column label="封面" width="80">
						<template #default="scope">
							<img :src="`https://cdn.discordapp.com/icons/${scope.row.id}/${scope.row.icon}.png`" alt="封面" style="width: 50px; height: 50px" />
						</template>
					</el-table-column>
					<el-table-column property="id" label="服务器ID" width="190" />
					<el-table-column property="name" label="服务器名" />
				</el-table>
			</div>

			<div class="emoticonList" v-if="emojiListLoad">
				<div class="bar">
					<el-button color="#5865F2" plain @click="downloadEmoji('all')">下载所有emoji</el-button>
					<el-button color="#5865F2" plain @click="downloadEmoji('selected')">下载选择的emoji</el-button>
					<el-button color="#5865F2" plain @click="downloadSticker('all')">下载所有sticker</el-button>
					<el-button color="#5865F2" plain @click="downloadSticker('selected')">下载选择的sticker</el-button>
				</div>
				<el-collapse v-model="activeNames">
					<el-collapse-item title="表情" name="1">
						<span class="emoction" v-for="item in emojiList" :key="item.id">
							<input type="checkbox" :id="item.id" v-model="selectedEmoji" :value="item" />
							<label :for="item.id">
								<img :src="getEmojiUrl(item.id, item.animated)" alt="emoji" />
								<span>{{ item.name }}</span>
							</label>
						</span>
					</el-collapse-item>
					<el-collapse-item title="贴纸" name="2">
						<span class="emoction" v-for="item in stickerList" :key="item.id">
							<input type="checkbox" :id="item.id" v-model="selectedSticker" :value="item" />
							<label :for="item.id">
								<img :src="getStickerUrl(item.id, item.format_type)" alt="emoji" />
								<span>{{ item.name }}</span>
							</label>
						</span>
					</el-collapse-item>
				</el-collapse>
			</div>
		</div>
	</div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { ElMessageBox, ElNotification } from "element-plus";
import axios from "axios";
import { API } from "@/assets/discordApi.js";
import JSZip from "jszip";
import { saveAs } from "file-saver";

// 通知-错误
const notification = (message) => {
	ElNotification({
		title: "Error",
		message: message,
		type: "error",
	});
};

const token = ref("");
const dialogVisible = ref(false);
const isSave = ref(false);

// 提交token，判断是否为空并请求服务器列表
const serverList = ref([]);
let serverLoad = ref(false);
const submit = async () => {
	if (token.value == "") {
		return notification("token为空");
	}
	if (isSave.value) {
		localStorage.setItem("token", token.value);
	}

	try {
		const res = await API.request("GET", API.guilds, token.value);
		const info = await res.json();
		serverList.value = info.map(({ id, name, icon }) => ({ id, name, icon }));
		serverLoad.value = true;
	} catch (error) {
		notification("服务器列表获取失败: " + error);
	}
};

// 点击服务器, 获取表情列表
const emojiList = ref([]);
const stickerList = ref([]);
let emojiListLoad = ref(false);
const activeNames = ref(["1"]);
const handleCurrentChange = async (e) => {
	try {
		const [emojiRes, stickerRes] = await Promise.all([API.request("GET", API.emojis(e.id), token.value), API.request("GET", API.stickers(e.id), token.value)]);

		emojiList.value = await emojiRes.json();
		stickerList.value = await stickerRes.json();

		emojiListLoad.value = true;
	} catch (error) {
		notification("表情列表或贴纸列表获取失败: " + error);
	}
};

// 拼接emoji URL
const getEmojiUrl = (id, animated) => {
	return `https://cdn.discordapp.com/emojis/${id}.${animated ? "gif" : "png"}?v=1`;
};
// 拼接sticker URL
const getStickerUrl = (id, format) => {
	let suffix;
	switch (format) {
		case 1:
			suffix = "png";
			break;
		case 2:
			suffix = "png";
			break;
		case 3:
			suffix = "lottie";
			break;
		case 4:
			suffix = "gif";
			break;

		default:
			console.log("未知类型");
			break;
	}
	return `https://media.discordapp.net/stickers/${id}.${suffix}?size=1024`;
};

// 下载
const selectedEmoji = ref([]);
const selectedSticker = ref([]);
const downloadEmoji = (type) => {
	const zip = new JSZip();
	const fetchPromises = [];

	const emojiLists = type === "all" ? emojiList.value : selectedEmoji.value;

	emojiLists.forEach((item) => {
		const fileName = encodeURIComponent(item.name) + (item.animated ? ".gif" : ".png");
		const imageUrl = getEmojiUrl(item.id, item.animated);

		const fetchPromise = fetch(imageUrl)
			.then((response) => response.blob())
			.then((image) => zip.file(fileName, image))
			.catch((error) => console.error("Error fetching image:", error));

		fetchPromises.push(fetchPromise);
	});

	Promise.all(fetchPromises).then(() => {
		zip.generateAsync({ type: "blob" })
			.then((content) => saveAs(content, type === "all" ? "download-all-emoji.zip" : "download-selected-images.zip"))
			.catch((error) => console.error("Error generating zip:", error));
	});
};
const downloadSticker = (type) => {
	const zip = new JSZip();
	const fetchPromises = [];

	const stickerLists = type === "all" ? stickerList.value : selectedSticker.value;

	stickerLists.forEach((item) => {
		let fileName = encodeURIComponent(item.name);
		const imageUrl = getStickerUrl(item.id, item.format_type);
		switch (item.format_type) {
			case 1:
				fileName += ".png";
				break;
			case 2:
				fileName += ".png";
				break;
			case 3:
				fileName += ".lottie";
				break;
			case 4:
				fileName += ".gif";
				break;

			default:
				console.log("未知类型");
				break;
		}

		const fetchPromise = fetch(imageUrl)
			.then((response) => response.blob())
			.then((image) => {
				zip.file(fileName, image);
			})
			.catch((error) => {
				console.error("Error fetching image:", error);
			});

		fetchPromises.push(fetchPromise);
	});

	Promise.all(fetchPromises).then(() => {
		zip.generateAsync({ type: "blob" })
			.then((content) => {
				saveAs(content, "download-all-sticker.zip");
			})
			.catch((error) => {
				console.error("Error generating zip:", error);
			});
	});
};

onMounted(() => {
	const saveToken = localStorage.getItem("token");
	if (saveToken) {
		token.value = saveToken;
	}
})
</script>

<style lang="scss" scoped>
@import url("../assets/download.scss");
</style>
