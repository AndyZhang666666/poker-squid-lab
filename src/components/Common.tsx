import type { LabState } from '@/lib/session';
import { markUnits, seatName, type Round } from '@/lib/rules';
export type Lang = 'zh' | 'en';
export type PanelProps = {
  lang: Lang;
  state: LabState;
  update: (fn: (state: LabState) => LabState) => void;
};
export const tr = (lang: Lang, zh: string, en: string) => (lang === 'zh' ? zh : en);
export const number = (value: number, digits = 2) =>
  new Intl.NumberFormat('en', { maximumFractionDigits: digits }).format(
    Object.is(value, -0) ? 0 : value,
  );
export const signed = (value: number) =>
  `${value > 0 ? '+' : value < 0 ? '−' : ''}${number(Math.abs(value))}`;
export function Cards({ cards }: { cards: string[] }) {
  const suits: Record<string, string> = { c: '♣', d: '♦', h: '♥', s: '♠' };
  return (
    <div className="cards" aria-label={cards.map((c) => c[0] + suits[c[1]]).join(' ')}>
      {cards.map((c) => (
        <span
          className={`playing-card ${/[dh]/.test(c[1]) ? 'red' : ''}`}
          key={c}
          aria-hidden="true"
        >
          <span>{c[0] === 'T' ? '10' : c[0]}</span>
          <b>{suits[c[1]]}</b>
        </span>
      ))}
    </div>
  );
}
export function Marks({
  round,
  lang,
  onWin,
  disabled = false,
}: {
  round: Round;
  lang: Lang;
  onWin?: (seat: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="seat-grid">
      {round.marks.map((count, i) => {
        const body = (
          <>
            <span className="seat-name">
              {seatName(i, round.rules.players)}
              {i === round.rules.players - 1 ? <small>{tr(lang, '你', 'You')}</small> : null}
            </span>
            <span className={`marker-strip ${count ? 'held' : ''}`} aria-hidden="true">
              {Array.from({ length: Math.min(count, 3) }, (_, j) => (
                <i key={j} />
              ))}
              {count > 3 ? <b>＋{count - 3}</b> : null}
              {!count ? <span>—</span> : null}
            </span>
            <span className="seat-count">
              {count} {tr(lang, '枚', 'markers')}
              {count >= 3 && round.rules.mode === 'infinite' ? <em> ×2</em> : null}
            </span>
          </>
        );
        return onWin ? (
          <button
            className={`seat ${count ? 'safe' : 'at-risk'}`}
            key={i}
            onClick={() => onWin(i)}
            disabled={disabled}
            aria-label={`${seatName(i, round.rules.players)} ${tr(lang, '赢下主池', 'wins the main pot')}`}
          >
            {body}
          </button>
        ) : (
          <div className={`seat ${count ? 'safe' : 'at-risk'}`} key={i}>
            {body}
          </div>
        );
      })}
    </div>
  );
}
export function Ledger({ round, lang }: { round: Round; lang: Lang }) {
  const settled = round.settlement;
  return (
    <section className="panel ledger" aria-labelledby="ledger-title">
      <div className="section-heading">
        <h2 id="ledger-title">
          {tr(lang, '每一笔，都有去处', 'Every transfer has a destination')}
        </h2>
        <span>
          {tr(
            lang,
            round.ended ? '本轮已结束' : '尚未结算',
            round.ended ? 'Round complete' : 'Not settled yet',
          )}
        </span>
      </div>
      <p className="muted">
        {round.ended
          ? tr(
              lang,
              round.reason === 'supply'
                ? '标记已发完，无标者分别结算。'
                : '只剩一人无标，提前结算。',
              round.reason === 'supply'
                ? 'Supply is exhausted. Each unmarked player pays separately.'
                : 'One unmarked player remains. The round ends early.',
            )
          : tr(
              lang,
              '计价展示当前持有标记的份数；本轮结束前，不当作已经收到的奖励。',
              'Units describe current holdings, not payments already received. Settlement happens at the endpoint.',
            )}
      </p>
      <table className="data-table">
        <thead>
          <tr>
            <th>{tr(lang, '座位', 'Seat')}</th>
            <th>{tr(lang, '计价份数', 'Units')}</th>
            <th>{tr(lang, '结算', 'Settlement')}</th>
          </tr>
        </thead>
        <tbody>
          {round.marks.map((count, i) => (
            <tr key={i}>
              <td>
                {seatName(i, round.rules.players)}
                {i === round.rules.players - 1 ? ' · ' + tr(lang, '你', 'You') : ''}
              </td>
              <td>{markUnits(round.rules.mode, count)}</td>
              <td>
                {settled ? (
                  <>
                    {signed(settled.payouts[i])} <small>BB</small>
                  </>
                ) : (
                  <span className="muted">{tr(lang, '待结束', 'Pending')}</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {settled ? (
        <>
          <div className="ledger-total">
            <span>{tr(lang, '所有人的收支合计', 'Total net transfer')}</span>
            <strong>
              {number(settled.payouts.reduce((a, b) => a + Math.round(b * 100), 0) / 100)} BB
            </strong>
          </div>
          <p className="caption">
            {tr(
              lang,
              `未发出的 ${round.remaining} 枚标记不参与结算。`,
              `${round.remaining} unissued markers are excluded.`,
            )}
          </p>
          <details>
            <summary>{tr(lang, '展开逐笔支付', 'Inspect every transfer')}</summary>
            <ul className="transfer-list">
              {settled.transfers.map((t, i) => (
                <li key={i}>
                  <span>
                    {seatName(t.from, round.rules.players)} → {seatName(t.to, round.rules.players)}
                  </span>
                  <b>{number(t.bb)} BB</b>
                </li>
              ))}
            </ul>
          </details>
        </>
      ) : null}
    </section>
  );
}
