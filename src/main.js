import "./assets/base.scss";
import "element-plus/dist/index.css";

import { createApp } from "vue";
import App from "./App.vue";

const app = createApp(App);

import ElementPlus from "element-plus";
app.use(ElementPlus);

import axios from "axios";
axios.defaults.baseURL = 'https://discord.com/api/v10';

app.mount("#app");
