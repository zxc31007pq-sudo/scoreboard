// 戰績卡元件 — 同時用於 PopUp 預覽和公開頁面

const SPORT_ICONS  = { basketball:"🏀", badminton:"🏸", tabletennis:"🏓", pickleball:"🥒" };
const SPORT_LABELS = { basketball:"籃球", badminton:"羽球", tabletennis:"桌球", pickleball:"匹克球" };

export default function StatsCard({ name, records, selectedSports }) {
  // 只顯示選中球類的紀錄
  const filtered = selectedSports
    ? records.filter(r => selectedSports.includes(r.sport))
    : records;

  const wins     = filtered.filter(r => r.result === "勝").length;
  const total    = filtered.length;
  const winRate  = total ? Math.round(wins / total * 100) : 0;
  const pts      = filtered.reduce((a, r) => a + (r.pts || 0), 0);

  // Group by sport+mode
  const groups = {};
  filtered.forEach(r => {
    const key = `${r.sport}__${r.mode}`;
    if (!groups[key]) groups[key] = { sport: r.sport, mode: r.mode, wins: 0, total: 0 };
    groups[key].total++;
    if (r.result === "勝") groups[key].wins++;
  });

  return (
    <div id="stats-card" style={{
      background: "#0a0a0a",
      borderRadius: 20,
      padding: "24px 22px",
      fontFamily: "'Inter','Helvetica Neue',sans-serif",
      color: "#f0f0f0",
      width: "100%",
      boxSizing: "border-box",
    }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: 18,
      }}>
        <div style={{
          fontSize: 11, fontWeight: 800, letterSpacing: 3,
          color: "#cc0000",
        }}>SCOREBOARD</div>
        <div style={{ fontSize: 9, color: "#333", letterSpacing: 1 }}>
          scoreboard-neon-nine.vercel.app
        </div>
      </div>

      {/* Name */}
      <div style={{ fontSize: 22, fontWeight: 900, marginBottom: 16, letterSpacing: -0.5 }}>
        {name}
      </div>

      {/* Stats row */}
      <div style={{
        display: "flex", background: "#111",
        borderRadius: 12, padding: "12px 0",
        marginBottom: 16,
      }}>
        {[
          { label: "場次", value: total },
          { label: "勝場", value: wins },
          { label: "勝率", value: winRate + "%" },
          { label: "積分", value: pts },
        ].map((s, i) => (
          <div key={i} style={{
            flex: 1, textAlign: "center",
            borderRight: i < 3 ? "1px solid #1e1e1e" : "none",
          }}>
            <div style={{
              fontSize: 20, fontWeight: 900,
              fontFamily: "'Courier New',monospace",
              color: "#f0f0f0",
            }}>{s.value}</div>
            <div style={{ fontSize: 9, color: "#555", marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Sport breakdown */}
      {Object.values(groups).length > 0 && (
        <div style={{
          background: "#111", borderRadius: 12, padding: "12px 14px",
          display: "flex", flexDirection: "column", gap: 8,
        }}>
          {Object.values(groups).map((g, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              paddingBottom: i < Object.values(groups).length - 1 ? 8 : 0,
              borderBottom: i < Object.values(groups).length - 1 ? "1px solid #1a1a1a" : "none",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 16 }}>{SPORT_ICONS[g.sport] || "🏅"}</span>
                <span style={{ fontSize: 12, color: "#aaa" }}>
                  {SPORT_LABELS[g.sport] || g.sport} {g.mode}
                </span>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#22c55e" }}>
                  {g.wins}勝
                </span>
                <span style={{ fontSize: 12, color: "#555" }}>
                  {g.total - g.wins}敗
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {total === 0 && (
        <div style={{
          background: "#111", borderRadius: 12, padding: "20px",
          textAlign: "center", color: "#444", fontSize: 13,
        }}>
          尚無比賽紀錄
        </div>
      )}
    </div>
  );
}
