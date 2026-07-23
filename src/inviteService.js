import {
  collection, addDoc, getDoc, getDocs, doc, updateDoc,
  query, orderBy, arrayUnion, arrayRemove, serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";

export const MAX_DURATION_MS = 4 * 60 * 60 * 1000; // 時間區間上限4小時

export const SPORT_NAMES = {
  basketball: "籃球", badminton: "羽球", tabletennis: "桌球", pickleball: "匹克球",
};

export const SPORT_ACCENTS = {
  basketball: "#2563EB", badminton: "#1d4ed8", tabletennis: "#059669", pickleball: "#7c3aed",
};

export const GENDER_LABELS = {
  male_only: "僅限男生", female_only: "僅限女生", open: "男女不拘",
};

// 各球類程度分級選項，籃球不分級(null)
export const LEVEL_OPTIONS = {
  basketball: null,
  badminton: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
  tabletennis: ["初級", "中級", "高級"],
  pickleball: ["1", "2", "3", "4", "5"],
};

// 台灣全22縣市＋行政區(鄉鎮市區)完整清單
export const TAIWAN_DISTRICTS = {
  台北市: ["中正區", "大同區", "中山區", "松山區", "大安區", "萬華區", "信義區", "士林區", "北投區", "內湖區", "南港區", "文山區"],
  新北市: ["板橋區", "新莊區", "中和區", "永和區", "土城區", "樹林區", "三峽區", "鶯歌區", "三重區", "蘆洲區", "五股區", "泰山區", "林口區", "淡水區", "金山區", "八里區", "萬里區", "石門區", "三芝區", "瑞芳區", "平溪區", "雙溪區", "貢寮區", "汐止區", "深坑區", "石碇區", "坪林區", "烏來區", "新店區"],
  桃園市: ["桃園區", "中壢區", "平鎮區", "八德區", "楊梅區", "蘆竹區", "大溪區", "龍潭區", "龜山區", "大園區", "觀音區", "新屋區", "復興區"],
  台中市: ["中區", "東區", "南區", "西區", "北區", "北屯區", "西屯區", "南屯區", "太平區", "大里區", "霧峰區", "烏日區", "豐原區", "后里區", "石岡區", "東勢區", "和平區", "新社區", "潭子區", "大雅區", "神岡區", "大肚區", "沙鹿區", "龍井區", "梧棲區", "清水區", "大甲區", "外埔區", "大安區"],
  台南市: ["中西區", "東區", "南區", "北區", "安平區", "安南區", "永康區", "歸仁區", "新化區", "左鎮區", "玉井區", "楠西區", "南化區", "仁德區", "關廟區", "龍崎區", "官田區", "麻豆區", "佳里區", "西港區", "七股區", "將軍區", "學甲區", "北門區", "新營區", "後壁區", "白河區", "東山區", "六甲區", "下營區", "柳營區", "鹽水區", "善化區", "大內區", "山上區", "新市區", "安定區"],
  高雄市: ["新興區", "前金區", "苓雅區", "鹽埕區", "鼓山區", "旗津區", "前鎮區", "三民區", "楠梓區", "小港區", "左營區", "仁武區", "大社區", "岡山區", "路竹區", "阿蓮區", "田寮區", "燕巢區", "橋頭區", "梓官區", "彌陀區", "永安區", "湖內區", "鳳山區", "大寮區", "林園區", "鳥松區", "大樹區", "旗山區", "美濃區", "六龜區", "內門區", "杉林區", "甲仙區", "桃源區", "那瑪夏區", "茂林區", "茄萣區"],
  基隆市: ["仁愛區", "信義區", "中正區", "中山區", "安樂區", "暖暖區", "七堵區"],
  新竹市: ["東區", "北區", "香山區"],
  新竹縣: ["竹北市", "竹東鎮", "新埔鎮", "關西鎮", "湖口鄉", "新豐鄉", "芎林鄉", "橫山鄉", "北埔鄉", "寶山鄉", "峨眉鄉", "尖石鄉", "五峰鄉"],
  苗栗縣: ["苗栗市", "頭份市", "竹南鎮", "後龍鎮", "通霄鎮", "苑裡鎮", "卓蘭鎮", "大湖鄉", "公館鄉", "銅鑼鄉", "南庄鄉", "頭屋鄉", "三義鄉", "西湖鄉", "造橋鄉", "三灣鄉", "獅潭鄉", "泰安鄉"],
  彰化縣: ["彰化市", "鹿港鎮", "和美鎮", "線西鄉", "伸港鄉", "福興鄉", "秀水鄉", "花壇鄉", "芬園鄉", "員林市", "溪湖鎮", "田中鎮", "大村鄉", "埔鹽鄉", "埔心鄉", "永靖鄉", "社頭鄉", "二水鄉", "北斗鎮", "二林鎮", "田尾鄉", "埤頭鄉", "芳苑鄉", "大城鄉", "竹塘鄉", "溪州鄉"],
  南投縣: ["南投市", "埔里鎮", "草屯鎮", "竹山鎮", "集集鎮", "名間鄉", "鹿谷鄉", "中寮鄉", "魚池鄉", "國姓鄉", "水里鄉", "信義鄉", "仁愛鄉"],
  雲林縣: ["斗六市", "斗南鎮", "虎尾鎮", "西螺鎮", "土庫鎮", "北港鎮", "古坑鄉", "大埤鄉", "莿桐鄉", "林內鄉", "二崙鄉", "崙背鄉", "麥寮鄉", "東勢鄉", "褒忠鄉", "台西鄉", "元長鄉", "四湖鄉", "口湖鄉", "水林鄉"],
  嘉義市: ["東區", "西區"],
  嘉義縣: ["太保市", "朴子市", "布袋鎮", "大林鎮", "民雄鄉", "溪口鄉", "新港鄉", "六腳鄉", "東石鄉", "義竹鄉", "鹿草鄉", "水上鄉", "中埔鄉", "竹崎鄉", "梅山鄉", "番路鄉", "大埔鄉", "阿里山鄉"],
  屏東縣: ["屏東市", "潮州鎮", "東港鎮", "恆春鎮", "萬丹鄉", "長治鄉", "麟洛鄉", "九如鄉", "里港鄉", "鹽埔鄉", "高樹鄉", "萬巒鄉", "內埔鄉", "竹田鄉", "新埤鄉", "枋寮鄉", "新園鄉", "崁頂鄉", "林邊鄉", "南州鄉", "佳冬鄉", "琉球鄉", "車城鄉", "滿州鄉", "枋山鄉", "三地門鄉", "霧台鄉", "瑪家鄉", "泰武鄉", "來義鄉", "春日鄉", "獅子鄉", "牡丹鄉"],
  宜蘭縣: ["宜蘭市", "羅東鎮", "蘇澳鎮", "頭城鎮", "礁溪鄉", "壯圍鄉", "員山鄉", "冬山鄉", "五結鄉", "三星鄉", "大同鄉", "南澳鄉"],
  花蓮縣: ["花蓮市", "鳳林鎮", "玉里鎮", "新城鄉", "吉安鄉", "壽豐鄉", "光復鄉", "豐濱鄉", "瑞穗鄉", "富里鄉", "秀林鄉", "萬榮鄉", "卓溪鄉"],
  台東縣: ["台東市", "成功鎮", "關山鎮", "卑南鄉", "大武鄉", "太麻里鄉", "東河鄉", "長濱鄉", "鹿野鄉", "池上鄉", "綠島鄉", "蘭嶼鄉", "延平鄉", "海端鄉", "達仁鄉", "金峰鄉"],
  澎湖縣: ["馬公市", "湖西鄉", "白沙鄉", "西嶼鄉", "望安鄉", "七美鄉"],
  金門縣: ["金城鎮", "金湖鎮", "金沙鎮", "金寧鄉", "烈嶼鄉", "烏坵鄉"],
  連江縣: ["南竿鄉", "北竿鄉", "莒光鄉", "東引鄉"],
};

function isExpired(invite) {
  const endDateTime = new Date(`${invite.date}T${invite.endTime}:00`);
  return Date.now() > endDateTime.getTime();
}

// 建立新邀約
export async function createInvite(data) {
  const start = new Date(`${data.date}T${data.startTime}:00`);
  const end = new Date(`${data.date}T${data.endTime}:00`);
  if (end.getTime() - start.getTime() <= 0 || end.getTime() - start.getTime() > MAX_DURATION_MS) {
    throw new Error("時間區間需大於0且不超過4小時");
  }

  const ref = await addDoc(collection(db, "invites"), {
    sport: data.sport,
    type: data.type,
    city: data.city,
    district: data.district,
    address: data.address,
    locationNote: data.locationNote || "",
    date: data.date,
    startTime: data.startTime,
    endTime: data.endTime,
    levelTag: data.levelTag ?? null,
    newbieFriendly: !!data.newbieFriendly,
    genderRestriction: data.genderRestriction || "open",
    hostUid: data.hostUid,
    isFull: false,
    participants: [],
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

// 讀取邀約列表，支援 sport / city / district / level 篩選
// 惰性過期檢查：只在前端過濾不顯示已過期的邀約，不刪除資料庫紀錄(比照現有比賽紀錄的保留模式)
export async function getInvites(filters = {}) {
  const snap = await getDocs(query(collection(db, "invites"), orderBy("createdAt", "desc")));
  let invites = snap.docs.map(d => ({ id: d.id, ...d.data() }));

  invites = invites.filter(inv => !isExpired(inv));

  if (filters.sport) invites = invites.filter(inv => inv.sport === filters.sport);
  if (filters.city) invites = invites.filter(inv => inv.city === filters.city);
  if (filters.district) invites = invites.filter(inv => inv.district === filters.district);
  if (filters.level) invites = invites.filter(inv => inv.levelTag === filters.level);

  return invites;
}

// 讀取單一邀約
export async function getInvite(inviteId) {
  const snap = await getDoc(doc(db, "invites", inviteId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

// 報名參加
export async function joinInvite(inviteId, uid) {
  const ref = doc(db, "invites", inviteId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error("邀約不存在");
  const invite = snap.data();

  if (invite.isFull) throw new Error("此邀約已額滿");
  if (invite.participants?.includes(uid)) throw new Error("你已經報名過了");

  await updateDoc(ref, { participants: arrayUnion(uid) });
}

// 取消報名(不動 isFull)
export async function leaveInvite(inviteId, uid) {
  await updateDoc(doc(db, "invites", inviteId), { participants: arrayRemove(uid) });
}

// 發起人手動切換已額滿狀態
export async function toggleFull(inviteId, isFull) {
  await updateDoc(doc(db, "invites", inviteId), { isFull });
}

// 新增留言
export async function addComment(inviteId, text, user) {
  const trimmed = text.trim();
  if (!trimmed) throw new Error("留言內容不能為空");
  await addDoc(collection(db, "invites", inviteId, "comments"), {
    text: trimmed,
    authorUid: user.uid,
    authorName: user.displayName || "球員",
    createdAt: serverTimestamp(),
  });
}

// 讀取留言列表
export async function getComments(inviteId) {
  const snap = await getDocs(
    query(collection(db, "invites", inviteId, "comments"), orderBy("createdAt", "asc"))
  );
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// 檢舉留言(只寫入 reports 集合，供之後管理端處理)
export async function reportComment(inviteId, commentId, reporterUid, reason) {
  await addDoc(collection(db, "reports"), {
    inviteId,
    commentId,
    reporterUid,
    reason: reason || "",
    createdAt: serverTimestamp(),
    status: "pending",
  });
}
