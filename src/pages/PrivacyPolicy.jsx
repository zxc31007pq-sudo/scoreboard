import { useNavigate } from "react-router-dom";

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: "100vh", background: "#F8FAFC",
      fontFamily: "'Noto Sans TC','Inter','Helvetica Neue',sans-serif",
      display: "flex", flexDirection: "column", alignItems: "center",
      padding: "24px 16px 48px",
    }}>
      <div style={{ width: "100%", maxWidth: 640, display: "flex", flexDirection: "column", gap: 16 }}>
        <button onClick={() => navigate(-1)} style={{
          alignSelf: "flex-start",
          padding: "8px 16px", borderRadius: 10,
          background: "#FFFFFF", border: "1px solid #E2E8F0",
          color: "#64748B", fontSize: 12, cursor: "pointer", fontFamily: "inherit",
        }}>← 返回</button>

        <div style={{
          background: "#FFFFFF", border: "1px solid #E2E8F0",
          borderRadius: 20, padding: "28px 24px",
          display: "flex", flexDirection: "column", gap: 4,
        }}>
          <div style={{ fontSize: 22, fontWeight: 900, color: "#0F172A" }}>隱私權政策</div>
          <div style={{ fontSize: 12, color: "#64748B", marginBottom: 12 }}>最後更新：2026 年 7 月</div>

          <p style={{ fontSize: 13, color: "#0F172A", lineHeight: 1.9 }}>
            歡迎使用 KEEGOING（以下稱「本服務」）。本隱私權政策說明我們如何收集、使用及保護您的個人資料。使用本服務即表示您同意本政策的內容。
          </p>

          <h2 style={sectionStyle}>1. 我們收集哪些資料</h2>
          <p style={pStyle}>我們僅收集提供服務所必要的最少資料：</p>
          <p style={subHeadStyle}>帳號資訊</p>
          <ul style={ulStyle}>
            <li>透過 Google 登入時，取得您的姓名、電子信箱與唯一識別碼（UID）</li>
            <li>您自行設定的顯示名稱</li>
          </ul>
          <p style={subHeadStyle}>比賽與運動資料</p>
          <ul style={ulStyle}>
            <li>您參與或認領的比賽紀錄（比分、對戰對象、比賽時間、球類與模式）</li>
            <li>各球類/模式的段位積分、連勝紀錄</li>
            <li>裁判端（可能不需登入）於計分板輸入的比賽基本資訊，如隊伍名稱、比分</li>
          </ul>
          <p style={subHeadStyle}>裝置與技術資訊（Firebase 自動收集）</p>
          <ul style={ulStyle}>
            <li>裝置類型、瀏覽器版本</li>
            <li>基本存取紀錄與錯誤紀錄（用於除錯與系統維運）</li>
          </ul>

          <h2 style={sectionStyle}>2. 我們如何使用資料</h2>
          <ul style={ulStyle}>
            <li>提供計分板、比賽紀錄、段位積分等核心功能</li>
            <li>驗證您的帳號身份</li>
            <li>產生您的個人戰績卡與公開分享頁面（僅於您主動選擇分享時公開）</li>
            <li>防止重複認領、積分濫用等不當行為</li>
            <li>改善服務品質與修復錯誤</li>
          </ul>

          <h2 style={sectionStyle}>3. 資料分享</h2>
          <p style={pStyle}>我們不會販賣或出租您的個人資料。資料僅在以下情況下與第三方共享：</p>
          <ul style={ulStyle}>
            <li><strong>Google Firebase</strong>：本服務的後端基礎設施，用於身份驗證、資料庫儲存</li>
          </ul>
          <p style={pStyle}>以上第三方服務有其自有隱私政策，建議您另行查閱：</p>
          <ul style={ulStyle}>
            <li>Google：https://policies.google.com/privacy</li>
          </ul>

          <h2 style={sectionStyle}>4. 資料保留期限</h2>
          <ul style={ulStyle}>
            <li><strong>帳號資訊</strong>：帳號存在期間持續保留</li>
            <li><strong>比賽紀錄</strong>：無限期保留於資料庫中；畫面上僅顯示近一年內的比賽紀錄，超過一年之紀錄雖不顯示，但資料庫中仍完整保留</li>
            <li><strong>每季刪除額度</strong>：您可主動刪除特定比賽紀錄（每季最多3次），此為您主動選擇之刪除行為，與上述系統保留政策為獨立機制</li>
            <li><strong>刪除帳號</strong>：您可透過帳號設定內功能自行刪除帳號，系統將刪除您的個人資料、比賽紀錄與段位資料</li>
          </ul>

          <h2 style={sectionStyle}>5. 您的權利</h2>
          <p style={pStyle}>您有權：</p>
          <ul style={ulStyle}>
            <li>查詢我們持有的您的個人資料</li>
            <li>要求更正不正確的資料（顯示名稱可自行於帳號內修改）</li>
            <li>要求刪除您的帳號及相關資料</li>
            <li>要求停止蒐集、處理或利用您的個人資料</li>
          </ul>
          <p style={pStyle}>如需行使上述權利，請透過第 7 條的聯絡方式與我們聯繫。</p>

          <h2 style={sectionStyle}>6. 未成年人保護</h2>
          <p style={pStyle}>
            本服務並非專為兒童設計。若您為未成年人，請於監護人同意及陪同下使用本服務。若我們發現在未經監護人同意的情況下收集了兒童的個人資料，將盡快刪除相關資料。
          </p>

          <h2 style={sectionStyle}>7. 聯絡我們</h2>
          <p style={pStyle}>若您對本隱私政策有任何疑問，或需要行使資料相關權利，請透過以下方式聯絡我們：</p>
          <p style={pStyle}>電子郵件：zxc31007pq@gmail.com</p>
          <p style={pStyle}>我們將盡快回覆您的請求。</p>

          <h2 style={sectionStyle}>8. 政策更新</h2>
          <p style={pStyle}>
            我們可能定期更新本隱私政策。重大變更將透過網站公告或其他適當方式通知您。繼續使用本服務即表示您接受更新後的政策。
          </p>
        </div>
      </div>
    </div>
  );
}

const sectionStyle = { fontSize: 16, fontWeight: 800, color: "#0F172A", marginTop: 16, marginBottom: 2 };
const subHeadStyle = { fontSize: 13, fontWeight: 700, color: "#0F172A", marginTop: 8, marginBottom: 2 };
const pStyle = { fontSize: 13, color: "#0F172A", lineHeight: 1.9, margin: "4px 0" };
const ulStyle = { fontSize: 13, color: "#0F172A", lineHeight: 1.9, margin: "4px 0", paddingLeft: 20 };
