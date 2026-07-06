# Scoreboard 專案開發判斷準則（2026-07-06 資安強化更新版）

> 用途：接手 Scoreboard 專案後續開發時的判斷依據與行為準則，非功能清單。
> 功能現況、資料結構、已修 bug 清單請見另一份《開發現況交接文件》。
> 若用 Claude Code 開發，可將本檔另存為 `CLAUDE.md` 直接使用；若在 claude.ai 網頁聊天介面，貼上本檔內容作為第一則訊息即可。
> 本版新增：第七章資安現況、附錄 Firestore 規則全文；並更新環境分離、已知坑等章節。

---

## 一、專案背景（30秒版）

多運動計分板網站。React + Vite + Firebase(Auth+Firestore) + Vercel，純前端 SPA，沒有自己的後端伺服器。開發者是**非工程背景的個人使用者**，透過 Windows CMD 操作 git，需要每一步都給明確指令，不能假設對方懂術語。

- 正式版網址：`https://scoreboard-neon-nine.vercel.app`
- 測試版網址：`https://scoreboard-git-dev-scoreboard-z.vercel.app`（dev 分支的 Vercel 預覽）

2026-07-06 已完成一輪完整資安檢查與修補（詳見第七章），後續開發不要把修好的洞改回去。

---

## 二、最高優先原則（違反會出真實資料事故）

### 1. 正式版與測試版是兩個完全獨立的 Firebase 專案

- 正式：`scoreboard-1b6b3`（真實使用者資料）
- 測試：`scoreboard-dev-e124d`
- 兩者靠 `src/firebase.js` 裡的 `firebaseConfig` 區分，**檔案內容不同**
- 本機用兩個獨立資料夾：`scoreboard`(main) / `scoreboard-dev`(dev)
- **2026-07-06 起，測試版設定已正式 commit 進 dev 分支**（過去只存在本機、沒 commit，導致 dev 分支的 Vercel 預覽網站一度連到正式資料庫）。現在 main 與 dev 兩個分支的 `firebase.js` 內容不同，**merge 時 git 可能對這個檔案產生衝突或直接覆蓋，是最高風險點**

**規則**：任何一次 git merge（尤其 dev → main）**之後、push 之前**，一律要求使用者執行 `type src\firebase.js`，確認 `projectId` 是 `scoreboard-1b6b3` 才准許 push。這個檢查不能省略，過去已經出過事故。反向亦然：dev 資料夾的 `projectId` 必須是 `scoreboard-dev-e124d`。

### 2. Firestore 安全性規則永遠不能是「測試模式」

- 測試模式 = 任何人可讀寫全部資料 + 30天後自動鎖死
- 正式版跟測試版都必須維持自訂規則，**目前生效的規則全文見本文件附錄**，兩個專案內容相同
- **每次新增一個會寫入 Firestore 的新集合/子集合**，要主動檢查安全性規則有沒有涵蓋到，不要等使用者回報「Missing or insufficient permissions」才發現漏補
- **每次修改「寫入 `matches` 的程式行為」，必須同步修改規則**：目前規則把認領寫入鎖到「只能把自己加進認領名單、一次一人、不能移除、過期後拒絕」。如果之後要做「取消認領」「補認領」之類的功能，規則一定要跟著改，否則功能會直接被資料庫拒絕

### 3. 資料正確性優先於功能完整性：「算不準就擋下，不要硬算」

這個專案對「積分/連勝」類資料採取的一貫原則是：**當某個操作可能導致計算結果不可靠時，寧可擋下操作、丟出明確錯誤，也不要讓它靜默算出錯誤數字。**

已落地的例子：
- `updateClaimSide`（改認領隊伍）：只有當「目前段位資料」跟「這筆紀錄認領當下的快照」一致時才允許回溯重算；不一致（代表期間又有新比賽）就直接擋下並提示使用者
- `deleteRecord`：只允許刪除「該模式目前最新一筆」紀錄，非最新一筆一律擋下

**後續開發任何會修改/回溯計算結果的功能，都套用同一套邏輯**：先做安全性檢查，不安全就明確拒絕並說明原因，不要嘗試「盡量猜」或「忽略邊界情況硬算」。

---

## 三、資料設計慣例（新功能要延續）

1. **快照模式**：任何會計算並寫入衍生數值的動作（例如認領時算出的積分），同時把「算之前的狀態」跟「算之後的狀態」都存到該筆紀錄上（`rankBefore` / `rankAfter`）。之後任何要回溯、刪除、修改的功能，都靠比對這個快照來判斷安不安全，不要重新用不可靠的方式反推。

2. **舊資料相容而非強制遷移**：格式升級後，舊資料不會自動轉換，但也不能讓舊資料讓新功能壞掉。做法是「偵測到缺欄位 → 跳過新邏輯，退回舊行為」，不是「假設欄位一定存在直接崩潰」。

3. **各球類 × 各模式獨立**：段位、連勝這類累積數字，永遠以 `{sport}_{mode}` 當作獨立單位分開計算，不要合併。新增球類/模式時記得同步更新任何寫死列舉這些組合的地方（例如 `Player.jsx` 的顯示對照表）。

4. **`mode` 欄位的實際字串值必須跟畫面代碼核對，不能用猜的**——這個專案吃過虧：匹克球、桌球的 `mode` 實際傳值跟直覺猜測（"單打"/"雙打"）不一致，寫死用猜的對照表會導致資料顯示不出來。**每次要用某個欄位做判斷邏輯前，先去對應的計分板檔案裡確認實際傳的字串是什麼。**

5. **不要把個資存進公開可讀的文件**——Firestore 的讀取權限以「整份文件」為單位，公開戰績卡功能需要 `users/{uid}` 對所有人可讀，所以這份文件裡**永遠不能放 Email、電話等個資**（2026-07-06 已把 Email 從註冊流程移除並清空既有資料，不要加回去）。之後若需要存個資，放到規則限制「僅本人可讀」的獨立子集合。

---

## 四、前端/CSS 慣例（手機版面）

1. **Flexbox 子元素預設不會縮到比內容窄**：只要一列裡有固定像素寬度的按鈕/文字，父層是 `flex:1`，沒加 `minWidth:0` 就會在小螢幕（尤其手機橫式）被撐開、裁切、跑出捲軸。**任何新增的橫向排列區塊，只要裡面有多個固定寬度元素，一律加 `minWidth:0` 在父層。**

2. **內容塞不下時，用 `overflow-y: auto`（可捲動）取代 `overflow: hidden`（直接裁切)**。這個改法對桌面版是零影響（桌面高度夠，永遠不會觸發捲軸），只在真正塞不下的情況（手機橫式）才出現捲軸。**沒有不能這樣做的理由，之後新畫面直接照這個模式做，不用每次重新論證安不安全。**

3. **SVG/圖片類固定像素尺寸，一樣要注意響應式**：`width="200"` 這種寫死的 SVG 屬性，配合 `style={{width:"100%", height:"auto", maxWidth:200}}` 才會在窄空間縮小，不會用固定寬度硬撐版面。

---

## 五、UI 風格慣例（延續一致性）

- 深色主題：背景 `#0a0a0a` / `#111`，邊框 `#1e1e1e` / `#2a2a2a`
- 主色調：紅色 `#cc0000`（品牌色、CTA按鈕）
- 全站繁體中文文案，語氣直接、口語化，不要太生硬的公文腔
- 球類配色：籃球紅、羽球藍、桌球綠、匹克球紫（沿用 `Home.jsx` 的 `SPORTS` 陣列配色）
- 圓角統一用 `borderRadius: 8-20` 區間，數字越大用在越外層的卡片容器

---

## 六、跟這位使用者互動的行為準則

1. **對方不熟悉開發術語跟終端機**，任何要對方執行的指令：
   - 給完整、可以直接複製貼上的指令，不要省略步驟
   - 一次不要塞超過3-4行指令，跑完請對方截圖回報再繼續
   - 遇到 CMD 報錯（例如 `cat` 不是 Windows 指令），直接給 Windows 對應寫法（`type`），不用對方自己查
   - 給範例或示意文字時要特別小心，對方可能**原封不動照貼**（出過一次把「你的正式版網域/*」字面貼進設定的狀況）——能給確切值就給確切值，不得已要用占位文字時，明確標示「這裡要換成✕✕」並在下一步主動核對

2. **風險性操作要先解釋後果再動手**，尤其：
   - git merge / push 到 main（正式版）
   - 修改 Firestore 安全性規則
   - 刪除任何資料庫欄位或集合
   - 任何「這樣做會影響舊資料顯示/計算」的改動 → 先講清楚影響範圍，讓對方確認再做

3. **修改程式碼一律直接產出完整檔案給下載**，不要求對方手動貼片段——這是使用者明確要求過的工作方式。

4. **改完程式碼要做語法/括號平衡檢查**（`{}`、`()` 配對）。專案 devDependencies 裡有 oxlint（`npm run lint`），也可跑 `npm run build` 做完整驗證，改完一定要驗證過再交付。

5. **不確定的地方要主動查證，不要用記憶硬答**——尤其牽涉到 Firebase / Vercel / Google AdSense 這類會隨時間變動政策與介面的外部服務。

6. **修改任何基礎設定（規則、金鑰限制、環境設定）的標準流程**：先在測試版（`scoreboard-dev`）套用 → 使用者實測完整流程（開比賽 → 認領 → 改隊伍 → 刪紀錄）→ 通過後才動正式版。

---

## 七、資安現況（2026-07-06 完成的檢查與修補）

### 已修復（不要改回去）

1. **比賽竄改**：Firestore 規則已把 `matches` 的修改鎖到「登入者只能在過期前，把自己加進認領名單（總名單＋其中一隊各加自己一人），不能移除任何人、不能動其他欄位」。比分、勝負、過期時間在建立後就改不了
2. **Email 外洩**：註冊流程不再把 Email 寫進 `users/{uid}`（該文件所有人可讀），既有資料已手動清除。`Auth.jsx` 的 `createUserProfile` 不要再加回 email 欄位
3. **PRO 自行升級**：規則禁止使用者修改自己的 `plan` 欄位；註冊時強制為 `free`。之後 PRO 付款功能上線時，`plan` 的變更需要透過可信管道（不能是前端直接寫）
4. **安全性 HTTP 標頭**：`vercel.json` 已加上 X-Frame-Options 等標頭（防點擊劫持等）。改動 `vercel.json` 時不要刪掉 `headers` 區塊
5. **API 金鑰網域限制**：兩個 Firebase 專案的 Browser key 都已在 Google Cloud Console 限制只能從自家網域使用

### 已知且接受的風險（不用主動修，除非使用者要求）

- **玩家可以作弊「自己的」資料**：純前端架構下，積分計算在瀏覽器執行，懂技術的使用者可自行改自己的積分/段位/紀錄。規則已確保**改不了別人的**資料。要根治需要後端（Cloud Functions），受限免費方案暫不處理
- **刪除額度可自行重置**：額度存在使用者自己的文件裡且由前端寫入，規則無法區分正常寫入與作弊寫入
- **`privacy` 欄位未生效**：所有戰績卡都是公開的。要做隱私功能時再處理（動規則前注意：所有現有使用者的 privacy 都是 "private"，直接啟用會讓所有分享卡失效）
- **過期比賽資料不會真的刪除**：3小時過期只擋認領，文件會留在資料庫。之後可研究 Firestore TTL（設定前先確認免費方案可用性）
- **建立比賽無欄位驗證**：任何人可寫入任意內容的比賽文件（垃圾資料）。影響小，暫不處理

### 環境維護清單（換網址/加網域時必做）

新的網站網址要用 Google 登入，必須同時加到**兩個地方**（少一個就會出 `auth/unauthorized-domain` 或連線被拒）：
1. Firebase Console → 對應專案 → Authentication → 設定 → **授權網域**
2. Google Cloud Console → 對應專案 → API和服務 → 憑證 → Browser key → **網站限制**（格式：`網域/*`）

---

## 八、已知還沒解決、之後接手要留意的坑

- 籃球5v5認領目前**無人數上限**（因應換人制度），這是刻意的安全性 tradeoff，不是漏掉，除非使用者要求，否則不要「自動幫他加回上限」
- `records` 保存天數目前寫死14天，沒有依 `plan`（免費/PRO）欄位判斷，PRO付費功能開發時記得一併處理
- 段位系統的季度重置是「惰性檢查」（使用者打開頁面/認領新比賽時才觸發），不是排程自動執行——這是 Firebase 免費方案沒有 Cloud Functions 的限制下的權衡方案，除非升級 Firebase 方案，否則不用嘗試改成真排程
- **刪除帳號流程漏刪 `ranks` 子集合**（`Player.jsx` 的 `handleDeleteAccount` 只刪 records 和個人資料），會留下無個資的孤兒資料，之後有動到該流程時順手補
- Google AdSense 串接卡在「網站內容形式跟審核偏好的原創文字內容不太搭」，討論中的方案是先加「關於本站/使用說明/隱私權政策」頁面，尚未動工

---

## 九、給接手 session 的一句話總結

這個專案目前最大的風險不是程式邏輯本身，而是「**同一份程式碼要同時服務兩個完全獨立的 Firebase 資料庫**」這件事——只要涉及 git 操作、firebase.js、安全性規則，永遠先確認自己現在到底站在哪個環境，再動手；動規則永遠先測試版、後正式版。

---

## 附錄：目前生效的 Firestore 安全性規則全文（2026-07-06 版，兩個專案相同）

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    match /users/{uid} {
      allow read: if true;
      allow create: if request.auth != null && request.auth.uid == uid
        && request.resource.data.get('plan', 'free') == 'free';
      allow update: if request.auth != null && request.auth.uid == uid
        && !request.resource.data.diff(resource.data).affectedKeys().hasAny(['plan']);
      allow delete: if request.auth != null && request.auth.uid == uid;

      match /records/{recordId} {
        allow read: if true;
        allow write: if request.auth != null && request.auth.uid == uid;
      }

      match /ranks/{modeKey} {
        allow read: if true;
        allow write: if request.auth != null && request.auth.uid == uid;
      }
    }

    match /matches/{matchId} {
      allow create: if true;
      allow read: if true;
      allow update: if request.auth != null
        && request.time < resource.data.expiresAt
        && request.resource.data.diff(resource.data).affectedKeys()
           .hasOnly(['claimedBy', 'claimsA', 'claimsB'])
        && request.resource.data.claimedBy
           == resource.data.claimedBy.concat([request.auth.uid])
        && (
          (request.resource.data.claimsA
             == resource.data.claimsA.concat([request.auth.uid])
           && request.resource.data.claimsB == resource.data.claimsB)
          ||
          (request.resource.data.claimsB
             == resource.data.claimsB.concat([request.auth.uid])
           && request.resource.data.claimsA == resource.data.claimsA)
        );
      allow delete: if false;
    }
  }
}
```
