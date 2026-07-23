import { useNavigate } from "react-router-dom";

export default function TermsOfUse() {
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
          <div style={{ fontSize: 22, fontWeight: 900, color: "#0F172A" }}>使用條款</div>
          <div style={{ fontSize: 12, color: "#64748B", marginBottom: 12 }}>最後更新：2026 年 7 月</div>

          <p style={{ fontSize: 13, color: "#0F172A", lineHeight: 1.9 }}>
            歡迎使用 KEEGOING（以下稱「本服務」）。使用本服務即表示您同意本使用條款。
          </p>

          <h2 style={sectionStyle}>1. 服務說明</h2>
          <p style={pStyle}>KEEGOING 是一個運動計分與比賽紀錄平台，提供：</p>
          <ul style={ulStyle}>
            <li>免安裝、免登入即可使用的計分板（籃球、羽球、桌球、匹克球等）</li>
            <li>選擇性註冊之球員版帳號，提供比賽紀錄保存、段位積分系統、個人戰績卡分享</li>
          </ul>

          <h2 style={sectionStyle}>2. 帳號註冊與使用資格</h2>
          <ul style={ulStyle}>
            <li>球員版帳號透過 Google 帳號登入註冊，您應確保登入資訊之真實性</li>
            <li>您應妥善保管您的 Google 帳號安全，因帳號安全疏失導致的損失，本服務不負擔賠償責任</li>
            <li>每個 Google 帳號僅能對應一個 KEEGOING 帳號</li>
            <li>若您為未成年人，應於監護人同意及陪同下註冊使用</li>
          </ul>

          <h2 style={sectionStyle}>3. 使用者行為規範</h2>
          <p style={pStyle}>KEEGOING 對以下行為明確禁止：</p>

          <p style={subHeadStyle}>3.1 嚴禁以下行為</p>
          <ul style={ulStyle}>
            <li><strong>偽造或竄改比賽結果</strong>：包含謊報比分、認領非您本人參與的比賽、利用系統漏洞重複認領同一場比賽以獲取不當積分</li>
            <li><strong>濫用系統機制</strong>：利用多重帳號互相配合刷取積分、段位</li>
            <li><strong>不當使用者內容</strong>：於隊伍名稱、顯示名稱等自訂欄位中使用色情、暴力、仇恨言論、歧視、騷擾、人身攻擊或其他冒犯性內容</li>
            <li><strong>公布他人個資</strong>：未經同意公布其他使用者之姓名、聯絡方式等個人資料</li>
            <li><strong>詐騙或非法宣傳</strong>：利用本服務進行詐騙、釣魚、非法商品交易或宣傳</li>
            <li><strong>干擾服務運作</strong>：嘗試入侵系統、進行阻斷服務攻擊、大量自動化請求造成系統負擔</li>
            <li>任何違反本條款之行為</li>
          </ul>

          <p style={subHeadStyle}>3.2 檢舉方式</p>
          <p style={pStyle}>若您發現任何違反上述規範之情況，請透過第 7 條之聯絡方式向我們回報，並盡可能提供相關截圖或說明，以利我們處理。</p>

          <p style={subHeadStyle}>3.3 我們的處理方式</p>
          <ul style={ulStyle}>
            <li>違規內容或紀錄將被移除或修正</li>
          </ul>

          <h2 style={sectionStyle}>4. 服務變更、中斷與終止</h2>
          <ul style={ulStyle}>
            <li>本服務保留隨時修改、暫停或終止部分或全部服務內容之權利，將盡合理努力事先通知，但不保證服務永久提供或不中斷</li>
            <li>因系統維護、不可抗力因素（如天災、駭客攻擊、第三方服務中斷等）導致服務暫時無法使用，本服務不負賠償責任</li>
            <li>若本服務決定終止營運，將提前合理期間通知使用者，並提供資料匯出或刪除之協助方式</li>
          </ul>

          <h2 style={sectionStyle}>5. 免責聲明</h2>
          <p style={pStyle}>
            本服務以「現狀」（as is）提供，不保證服務不中斷或無錯誤。比賽紀錄、積分、段位資料係依使用者輸入或認領產生，本服務不保證資料之真實性或準確性，亦不介入使用者間因紀錄真實性產生之爭議。對於因使用本服務而產生之任何直接、間接、附帶、衍生性損害，本服務不負賠償責任。
          </p>

          <h2 style={sectionStyle}>6. 帳號終止與資料處理</h2>
          <ul style={ulStyle}>
            <li>您可隨時透過帳號設定內之功能自行刪除帳號</li>
            <li>若您違反本條款第 3 節之行為規範，本服務得逕行終止或限制您的帳號使用權限</li>
            <li>帳號資料之保存與刪除規則，詳見隱私權政策</li>
          </ul>

          <h2 style={sectionStyle}>7. 聯絡我們</h2>
          <p style={pStyle}>如有任何疑問，請聯絡：zxc31007pq@gmail.com</p>

          <h2 style={sectionStyle}>8. 條款修改</h2>
          <p style={pStyle}>
            本服務保留隨時修改本條款之權利，修改後將更新頁面最上方之「最後更新日期」。條款修改後，若您繼續使用本服務，即視為您同意修改後之條款內容。若有重大變更，將透過網站公告或其他適當方式通知您。
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
