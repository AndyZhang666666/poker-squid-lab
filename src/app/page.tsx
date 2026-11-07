'use client';
import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import SpotPanel from '@/components/SpotPanel';
import { tr, type Lang } from '@/components/Common';
import { useSession } from '@/lib/useSession';
import { decodeSession, mergeSession, downloadJSON } from '@/lib/session';
const SandboxPanel = dynamic(() => import('@/components/SandboxPanel'), {
  loading: () => <p role="status">正在载入 / Loading…</p>,
});
const ChallengePanel = dynamic(() => import('@/components/ChallengePanel'), {
  loading: () => <p role="status">正在载入 / Loading…</p>,
});
type Tab = 'spot' | 'sandbox' | 'challenges';
const tabs: Tab[] = ['spot', 'sandbox', 'challenges'];
export default function Page() {
  const session = useSession(),
    [lang, setLang] = useState<Lang>('zh'),
    [palette, setPalette] = useState('frost'),
    [tab, setTab] = useState<Tab>('spot'),
    [notice, setNotice] = useState('');
  const file = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const url = new URL(location.href);
    if (url.searchParams.get('lang') === 'en') setLang('en');
    setPalette(document.documentElement.dataset.palette || 'frost');
    const read = () => {
      const h = location.hash.slice(1) as Tab;
      if (tabs.includes(h)) setTab(h);
    };
    read();
    addEventListener('hashchange', read);
    addEventListener('popstate', read);
    return () => {
      removeEventListener('hashchange', read);
      removeEventListener('popstate', read);
    };
  }, []);
  useEffect(() => {
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
    document.title = tr(
      lang,
      '鱿鱼博弈实验室 · Squid Lab',
      'Squid Lab · One hand, different incentives',
    );
  }, [lang]);
  const theme = (value: string) => {
    setPalette(value);
    document.documentElement.dataset.palette = value;
    try {
      localStorage.setItem('palette', value);
    } catch {
      setNotice(
        tr(
          lang,
          '当前主题已应用；浏览器未允许保存。',
          'Theme applied for now; browser storage is unavailable.',
        ),
      );
    }
  };
  const go = (value: Tab) => {
    setTab(value);
    history.replaceState(null, '', `#${value}`);
    window.scrollTo({ top: 0 });
  };
  const importFile = async (selected: File | undefined) => {
    if (!selected) return;
    try {
      if (selected.size > 4000000) throw Error();
      const incoming = decodeSession(await selected.text());
      if (!incoming) throw Error();
      session.setState((s) => mergeSession(s, incoming));
      setNotice(
        tr(
          lang,
          '已恢复实验设置与回放，训练记录按作答 ID 合并。',
          'Experiment and replay restored; attempts were merged by ID.',
        ),
      );
    } catch {
      setNotice(
        tr(
          lang,
          '无法读取这份备份：版本或内容无效。当前实验和记录已保留。',
          'This backup has an unsupported version or invalid content. Your current experiment and progress are preserved.',
        ),
      );
    } finally {
      if (file.current) file.current.value = '';
    }
  };
  const labels =
    lang === 'zh'
      ? ['一手牌，三种结果', '规则沙盘', '局面挑战']
      : ['One hand, three outcomes', 'Rule sandbox', 'Spot challenges'];
  return (
    <>
      <header className="site-header">
        <div className="header-line">
          <a href="https://andyzhang666666.github.io/#projects" className="back-link">
            ← {tr(lang, 'Andy 的作品', 'Andy’s work')}
          </a>
          <div className="header-tools">
            <button
              onClick={() => setLang((v) => (v === 'zh' ? 'en' : 'zh'))}
              aria-label={tr(lang, '切换语言', 'Switch language')}
            >
              {lang === 'zh' ? 'EN' : '中'}
            </button>
            <select
              value={palette}
              onChange={(e) => theme(e.target.value)}
              aria-label={tr(lang, '配色', 'Theme')}
            >
              <option value="frost">{tr(lang, '霜 · 象牙纸', 'Frost · Ivory')}</option>
              <option value="mist">{tr(lang, '雾 · 青灰', 'Mist · Blue')}</option>
              <option value="copper">{tr(lang, '铜 · 墨绿', 'Copper · Forest')}</option>
              <option value="indigo">{tr(lang, '靛 · 石墨', 'Indigo · Graphite')}</option>
            </select>
          </div>
        </div>
        <div className="brand-line">
          <div className="brand-mark" aria-hidden="true">
            <i />
            <i />
            <i />
            <i />
          </div>
          <div>
            <h1>{tr(lang, '鱿鱼博弈实验室', 'Squid Lab')}</h1>
            <p>
              {tr(
                lang,
                '同样一手牌，换一种规则，争夺它的价值为什么变了？',
                'The same hand. A different rule. What changes its value?',
              )}
            </p>
          </div>
          <span className="brand-name">
            {lang === 'zh' ? 'Squid Lab' : 'Rules · Replay · Reasoning'}
          </span>
        </div>
        <nav className="workspace-nav" role="tablist" aria-label={tr(lang, '工作区', 'Workspaces')}>
          {tabs.map((value, i) => (
            <button
              role="tab"
              aria-selected={tab === value}
              aria-controls={`${value}-workspace`}
              id={`${value}-tab`}
              tabIndex={tab === value ? 0 : -1}
              key={value}
              onClick={() => go(value)}
              onKeyDown={(e) => {
                if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                  e.preventDefault();
                  const next = (i + (e.key === 'ArrowRight' ? 1 : 2)) % 3;
                  go(tabs[next]);
                  document.getElementById(`${tabs[next]}-tab`)?.focus();
                }
              }}
            >
              {labels[i]}
            </button>
          ))}
        </nav>
      </header>
      <main id={`${tab}-workspace`} role="tabpanel" aria-labelledby={`${tab}-tab`}>
        {session.ready ? (
          tab === 'spot' ? (
            <SpotPanel lang={lang} state={session.state} update={session.setState} />
          ) : tab === 'sandbox' ? (
            <SandboxPanel lang={lang} state={session.state} update={session.setState} />
          ) : (
            <ChallengePanel lang={lang} state={session.state} update={session.setState} />
          )
        ) : (
          <p role="status">
            {tr(lang, '正在恢复本机实验…', 'Restoring this browser’s experiment…')}
          </p>
        )}
      </main>
      <footer className="site-footer">
        <details className="rules-reference">
          <summary>{tr(lang, '本产品桌规、方法与来源', 'Rules, methods and sources')}</summary>
          <div className="rule-columns">
            <div>
              <h3>{tr(lang, '有限鱿鱼', 'Finite squid')}</h3>
              <p>
                {tr(
                  lang,
                  '每人最多一枚。主池独赢并亮牌获标；切池、边池和重复获标不发标。只剩一人无标时，向其余每人支付一份基础奖励。',
                  'One marker per player. A sole main-pot winner must reveal for the first award. Chops, side pots and repeat wins award nothing. The last unmarked player pays one base reward to every other player.',
                )}
              </p>
            </div>
            <div>
              <h3>{tr(lang, '无限鱿鱼', 'Infinite squid')}</h3>
              <p>
                {tr(
                  lang,
                  '总量为人数＋3，初始待发两枚。有效获标后待发重置为一枚；切池使待发＋1，上限为剩余数；未亮牌的首次获标不发标、待发保留。首次获标须亮牌，已有标记者无须再次亮牌。三个及以上全部两倍计价。',
                  'Supply is players + 3. The pending award begins at two, resets to one after issuance, and increases on a chop up to remaining supply. An unrevealed first win retains the pending award. First awards require a reveal; repeats do not. Holdings of three or more count double.',
                )}
              </p>
              <p>
                {tr(
                  lang,
                  '剩一人无标或标记发完时结束。每位无标者分别支付，未发出的标记不参与结算；阵容在一轮内固定。',
                  'End with one unmarked player or exhausted supply. Each unmarked player pays separately; unissued markers are excluded. The lineup stays fixed during a round.',
                )}
              </p>
            </div>
          </div>
          <p>
            {tr(
              lang,
              '不同牌局可能采用不同桌规。这里采用明示的教学规则，模拟使用固定频率假设，局面比较限定在说明的河牌场景。',
              'House rules differ. This app uses explicit teaching presets, fixed-frequency simulations and the stated river comparison.',
            )}
          </p>
          <div className="source-links">
            <a
              href="https://help-center.pokr.win/en/battle/guides/squid/"
              target="_blank"
              rel="noreferrer"
            >
              Pokr · {tr(lang, '有限规则参考', 'Finite reference')}
            </a>
            <a
              href="https://bluffking.ai/en/blog/poker-squid-game-friend-room/"
              target="_blank"
              rel="noreferrer"
            >
              BluffKing · {tr(lang, '无限规则参考', 'Infinite reference')}
            </a>
            <a
              href="https://github.com/AndyZhang666666/poker-squid-lab/blob/main/docs/METHODS.md"
              target="_blank"
              rel="noreferrer"
            >
              {tr(lang, '公式与开源复用', 'Methods & reuse')}
            </a>
          </div>
        </details>
        <div className="backup-row">
          <div>
            <p>
              {tr(
                lang,
                session.status === 'restored'
                  ? '已恢复本机的实验和训练进度。'
                  : session.status === 'blocked'
                    ? '旧记录无法读取，暂未覆盖；你仍可临时体验。'
                    : session.status === 'failed'
                      ? '浏览器保存不可用，请在离开前导出备份。'
                      : '实验与训练记录保存在当前浏览器。',
                session.status === 'restored'
                  ? 'Experiment and learning progress restored.'
                  : session.status === 'blocked'
                    ? 'Unreadable old data is preserved; you can explore temporarily.'
                    : session.status === 'failed'
                      ? 'Browser saving is unavailable. Export before leaving.'
                      : 'Experiments and progress stay in this browser.',
              )}
            </p>
            <small>
              {tr(
                lang,
                '计算无需账号或模型 API。原 Poker Lab 记录使用另一份存储。',
                'No account or model API is required. Poker Lab uses separate storage.',
              )}
            </small>
          </div>
          <div className="backup-actions">
            <button
              disabled={!session.ready}
              onClick={() => downloadJSON('squid-lab-backup-v1.json', session.state)}
            >
              {tr(lang, '导出实验与进度', 'Export experiment & progress')}
            </button>
            <button disabled={!session.ready} onClick={() => file.current?.click()}>
              {tr(lang, '导入备份', 'Import backup')}
            </button>
            {!session.saving ? (
              <button onClick={session.enableSaving}>
                {tr(lang, '启用新记录保存', 'Enable saving current data')}
              </button>
            ) : null}
            <input
              className="file-input"
              type="file"
              ref={file}
              accept="application/json,.json"
              onChange={(e) => importFile(e.target.files?.[0])}
              aria-label={tr(lang, '选择实验备份文件', 'Choose an experiment backup')}
            />
          </div>
        </div>
        {notice ? (
          <p className="notice" role="status">
            {notice}
          </p>
        ) : null}
        <div className="footer-end">
          <span>Andy Zhang · Squid Lab · MIT</span>
          <a
            href="https://github.com/AndyZhang666666/poker-squid-lab"
            target="_blank"
            rel="noreferrer"
          >
            GitHub ↗
          </a>
        </div>
      </footer>
    </>
  );
}
