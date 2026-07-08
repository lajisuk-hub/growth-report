'use client';

import { useState, useEffect, useRef } from 'react';

const STORAGE_KEY = 'growth-report-v2';

const EMPTY_INFO = {
  centerName: '',
  className: '',
  childName: '',
  teacherName: '',
  period: '2026학년도 1학기',
  coverPhoto: '',
};

const INTERVIEW_QUESTIONS = [
  { key: 'march', label: '① 아이의 3월은 어떠하였나요?', sub: '처음 등원했을 때, 적응하던 모습을 떠올려 주세요', ph: '예: 엄마와 떨어질 때 많이 울었어요. 일주일쯤 지나니 선생님 손을 잡고 들어왔어요' },
  { key: 'worry', label: '② 부모님께서 어린이집 다니며 가장 걱정하신 부분은?', sub: '걱정하셨던 점과, 한 학기 동안 어떻게 달라졌는지 적어주세요', ph: '예: 밥을 잘 안 먹을까 걱정하셨는데, 지금은 스스로 한 그릇을 다 먹어요' },
  { key: 'food', label: '③ 아이가 잘 먹는 음식은?', sub: '좋아하는 음식, 식사 시간 모습을 알려주세요', ph: '예: 미역국과 계란찜을 제일 좋아해요. 채소도 한두 입 먹어봐요' },
  { key: 'play', label: '④ 아이가 좋아하는 놀이는?', sub: '즐겨 하는 놀이를 알려주세요', ph: '예: 블록 쌓기와 미끄럼틀을 좋아해요' },
  { key: 'topic', label: '⑤ 아이가 최근 들어 관심 있는 놀이주제는?', sub: '요즘 푹 빠져 있는 주제가 있나요?', ph: '예: 공룡에 푹 빠져서 공룡 책과 공룡 흉내내기 놀이를 매일 해요' },
  { key: 'friend', label: '⑥ 친구관계는 어떠한가요?', sub: '친구들과 지내는 모습, 기억에 남는 장면을 알려주세요', ph: '예: 친구에게 먼저 장난감을 양보한 적이 있어요. 단짝 친구와 병원놀이를 즐겨요' },
  { key: 'grow', label: '⑦ 1학기 동안 가장 큰 변화는?', sub: '3월과 비교해 가장 크게 달라진 모습은?', ph: '예: 등원할 때 울지 않고 씩씩하게 인사해요' },
  { key: 'letter', label: '⑧ 부모님께 전하고 싶은 말', sub: '짧게 적어주시면 따뜻한 편지로 다듬어 드려요', ph: '예: 한 학기 동안 믿고 맡겨주셔서 감사해요. 2학기에도 잘 지켜봐 주고 싶어요' },
  { key: 'next', label: '⑨ 2학기 어린이집(우리 반)의 계획', sub: '2학기에 예정된 활동·행사를 적어주세요', ph: '예: 9월 가족운동회, 10월 가을소풍, 숲체험 시작' },
];

const EMPTY_TEXT = { march: '', worry: '', food: '', play: '', topic: '', friend: '', grow: '', letter: '', next: '' };

const RESULT_LABELS = {
  march: '3월의 우리 아이', worry: '부모님의 걱정, 이렇게 자랐어요', food: '잘 먹는 음식 · 식사 이야기',
  play: '좋아하는 놀이', topic: '요즘 관심 있는 놀이주제', friend: '친구 이야기',
  grow: '1학기 동안 가장 큰 변화', letter: '선생님의 편지', next: '2학기 안내',
};

// 사진을 작게 줄여서 저장 (용량 문제 방지)
function compressImage(file, maxDim, cb) {
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        const r = Math.min(maxDim / width, maxDim / height);
        width = Math.round(width * r);
        height = Math.round(height * r);
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);
      cb(canvas.toDataURL('image/jpeg', 0.82));
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

export default function Home() {
  const [step, setStep] = useState(1);
  const [info, setInfo] = useState(EMPTY_INFO);
  const [interview, setInterview] = useState(EMPTY_TEXT);
  const [photos, setPhotos] = useState([]); // {src, caption} 최대 4장
  const [result, setResult] = useState(EMPTY_TEXT);
  const [hasResult, setHasResult] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const loaded = useRef(false);

  // 저장된 내용 불러오기
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const d = JSON.parse(raw);
        if (d.info) setInfo({ ...EMPTY_INFO, ...d.info });
        if (d.interview) setInterview({ ...EMPTY_TEXT, ...d.interview });
        if (d.photos) setPhotos(d.photos);
        if (d.result) setResult({ ...EMPTY_TEXT, ...d.result });
        if (d.hasResult) setHasResult(true);
      }
    } catch (e) { /* 무시 */ }
    loaded.current = true;
  }, []);

  // 입력할 때마다 자동 저장
  useEffect(() => {
    if (!loaded.current) return;
    const t = setTimeout(() => {
      const data = { info, interview, photos, result, hasResult };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch (e) {
        // 사진 때문에 용량 초과 시 사진 빼고 저장
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...data, photos: [], info: { ...info, coverPhoto: '' } }));
        } catch (e2) { /* 무시 */ }
      }
    }, 400);
    return () => clearTimeout(t);
  }, [info, interview, photos, result, hasResult]);

  const setI = (k, v) => setInfo((p) => ({ ...p, [k]: v }));
  const setQ = (k, v) => setInterview((p) => ({ ...p, [k]: v }));
  const setR = (k, v) => setResult((p) => ({ ...p, [k]: v }));

  const addPhoto = (file) => {
    if (!file || photos.length >= 4) return;
    compressImage(file, 1200, (src) => setPhotos((p) => (p.length >= 4 ? p : [...p, { src, caption: '' }])));
  };

  const runAi = async () => {
    setError('');
    if (!info.childName.trim()) { setError('1단계에서 아이 이름을 먼저 입력해 주세요.'); return; }
    const answered = Object.values(interview).some((v) => v && v.trim());
    if (!answered) { setError('인터뷰 답변을 한 개 이상 적어주세요.'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/polish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ info, interview }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'AI 요청에 실패했습니다');
      setResult({ ...EMPTY_TEXT, ...data.result });
      setHasResult(true);
      setStep(3);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const skipAi = () => {
    setResult({ ...EMPTY_TEXT, ...interview });
    setHasResult(true);
    setStep(3);
  };

  const stepBtn = (n, label) => (
    <button key={n} className={step === n ? 'active' : step > n ? 'done' : ''} onClick={() => setStep(n)}>
      {label}
    </button>
  );

  return (
    <>
      <div className="app-ui">
        <div className="app-header">
          <h1>🌷 어린이집 한학기 성장보고서</h1>
          <p>인터뷰에 답하듯 짧게 적으면, AI가 학부모님께 드릴 예쁜 문장으로 다듬어 드려요</p>
        </div>

        <div className="steps no-print">
          {stepBtn(1, '1. 기본 정보')}
          {stepBtn(2, '2. 인터뷰 · 사진')}
          {stepBtn(3, '3. 글 다듬기')}
          {stepBtn(4, '4. 미리보기 · 저장')}
        </div>

        {error && <div className="error-box">⚠️ {error}</div>}

        {step === 1 && (
          <div className="card">
            <h2>기본 정보</h2>
            <p className="hint">보고서 표지와 본문에 들어갈 내용이에요.</p>
            <div className="grid2">
              <div className="field">
                <label>어린이집 이름</label>
                <input type="text" value={info.centerName} onChange={(e) => setI('centerName', e.target.value)} placeholder="예: 멘토어린이집" />
              </div>
              <div className="field">
                <label>반 이름</label>
                <input type="text" value={info.className} onChange={(e) => setI('className', e.target.value)} placeholder="예: 햇살반" />
              </div>
              <div className="field">
                <label>아이 이름</label>
                <input type="text" value={info.childName} onChange={(e) => setI('childName', e.target.value)} placeholder="예: 김하늘" />
              </div>
              <div className="field">
                <label>담임 선생님 이름</label>
                <input type="text" value={info.teacherName} onChange={(e) => setI('teacherName', e.target.value)} placeholder="예: 이보라" />
              </div>
            </div>
            <div className="field">
              <label>기간 표시</label>
              <input type="text" value={info.period} onChange={(e) => setI('period', e.target.value)} placeholder="예: 2026학년도 1학기" />
            </div>
            <div className="field">
              <label>표지 사진 <span className="sub">(선택 — 아이 독사진 추천)</span></label>
              {info.coverPhoto ? (
                <div className="photo-grid">
                  <div className="photo-slot">
                    <img src={info.coverPhoto} alt="표지 사진" />
                    <button className="remove" onClick={() => setI('coverPhoto', '')}>✕</button>
                  </div>
                </div>
              ) : (
                <input type="file" accept="image/*" onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) compressImage(f, 1200, (src) => setI('coverPhoto', src));
                  e.target.value = '';
                }} />
              )}
            </div>
            <div className="btn-row">
              <button className="btn btn-primary" onClick={() => setStep(2)}>다음 → 인터뷰 작성</button>
            </div>
          </div>
        )}

        {step === 2 && (
          <>
            <div className="card">
              <h2>선생님 인터뷰</h2>
              <p className="hint">
                문장이 아니어도 괜찮아요. 떠오르는 대로 짧게 메모하듯 적어주세요.
                비워둔 항목은 보고서에서 빠져요.
              </p>
              {INTERVIEW_QUESTIONS.map((q) => (
                <div className="field" key={q.key}>
                  <label>{q.label} <span className="sub">{q.sub}</span></label>
                  <textarea value={interview[q.key]} onChange={(e) => setQ(q.key, e.target.value)} placeholder={q.ph} />
                </div>
              ))}
            </div>

            <div className="card">
              <h2>활동 사진 (최대 4장)</h2>
              <p className="hint">2~3쪽에 두 장씩 실려요. 사진 아래 한 줄 설명도 적을 수 있어요.</p>
              <div className="photo-grid">
                {photos.map((p, i) => (
                  <div className="photo-slot" key={i}>
                    <img src={p.src} alt={`사진 ${i + 1}`} />
                    <button className="remove" onClick={() => setPhotos(photos.filter((_, j) => j !== i))}>✕</button>
                    <input
                      type="text"
                      value={p.caption}
                      placeholder="사진 설명 (예: 봄소풍에서)"
                      onChange={(e) => setPhotos(photos.map((x, j) => (j === i ? { ...x, caption: e.target.value } : x)))}
                    />
                  </div>
                ))}
                {photos.length < 4 && (
                  <label className="photo-slot photo-add">
                    <span className="plus">＋</span>
                    사진 추가
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) addPhoto(f);
                      e.target.value = '';
                    }} />
                  </label>
                )}
              </div>
            </div>

            <div className="card">
              <h2>글 다듬기</h2>
              <p className="hint">버튼을 누르면 AI가 위의 메모를 학부모님께 드릴 문장으로 다듬어요. (10~20초)</p>
              <div className="btn-row">
                <button className="btn btn-primary btn-big" onClick={runAi} disabled={loading}>
                  {loading ? (<><span className="spinner" />예쁜 문장으로 다듬는 중...</>) : '✨ AI로 문장 다듬기'}
                </button>
              </div>
              <div className="btn-row">
                <button className="btn btn-secondary" onClick={skipAi} disabled={loading}>AI 없이 적은 그대로 쓸게요</button>
              </div>
            </div>
          </>
        )}

        {step === 3 && (
          <div className="card">
            <h2>다듬어진 글 확인 · 수정</h2>
            <p className="hint">
              마음에 안 드는 부분은 직접 고칠 수 있어요.
              {hasResult ? '' : ' (아직 다듬어진 글이 없어요 — 2단계에서 AI 다듬기를 눌러주세요)'}
            </p>
            {Object.keys(RESULT_LABELS).map((k) => (
              <div className="field" key={k}>
                <label>{RESULT_LABELS[k]}</label>
                <textarea value={result[k]} onChange={(e) => setR(k, e.target.value)} placeholder="(비워두면 보고서에서 빠져요)" />
              </div>
            ))}
            <div className="btn-row">
              <button className="btn btn-secondary" onClick={() => setStep(2)}>← 인터뷰 다시 쓰기</button>
              <button className="btn btn-primary" onClick={() => setStep(4)}>미리보기 → </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="card no-print">
            <h2>미리보기 · PDF 저장</h2>
            <p className="hint">
              아래에 실제 인쇄될 4쪽이 보여요. 버튼을 누른 뒤 인쇄 화면에서
              <b> 대상(프린터)을 &lsquo;PDF로 저장&rsquo;</b>으로 고르면 PDF 파일로 저장돼요.
              종이로 인쇄하면 A4 앞뒤 2장이에요.
            </p>
            <div className="btn-row">
              <button className="btn btn-primary btn-big" onClick={() => window.print()}>🖨️ 인쇄 / PDF로 저장</button>
            </div>
          </div>
        )}
      </div>

      {step === 4 && (
        <div className="preview-scroll">
          <div className="preview-wrap print-area">
            <ReportSheets info={info} result={result} photos={photos} />
          </div>
        </div>
      )}
    </>
  );
}

// ───────── 보고서 4쪽 ─────────

const AREA_META = {
  march: { num: '01', chip: '적응 · 정서', chipColor: 'chip-clay', title: '3월, 처음 만났을 때' },
  worry: { num: '02', chip: '가정 연계', chipColor: 'chip-gold', title: '부모님의 걱정, 이렇게 자랐어요' },
  food: { num: '03', chip: '기본생활', chipColor: 'chip-sage', title: '잘 먹는 음식과 식사 이야기' },
  play: { num: '04', chip: '놀이', chipColor: 'chip-sky', title: '좋아하는 놀이' },
  topic: { num: '05', chip: '관심 · 탐구', chipColor: 'chip-clay', title: '요즘 관심 있는 놀이주제' },
  friend: { num: '06', chip: '사회관계', chipColor: 'chip-sage', title: '친구와의 관계' },
};

function Section({ k, text }) {
  const m = AREA_META[k];
  if (!text || !text.trim()) return null;
  return (
    <div className="section">
      <div className="sec-head">
        <span className="sec-num">{m.num}</span>
        <span className="sec-title">{m.title}</span>
        <span className={`sec-chip ${m.chipColor}`}>{m.chip}</span>
      </div>
      <p>{text}</p>
    </div>
  );
}

function PhotoBand({ items }) {
  const list = items.filter(Boolean);
  if (!list.length) return null;
  return (
    <div className="photo-band">
      {list.map((p, i) => (
        <div className="report-photo" key={i}>
          <div className="ph-frame"><img src={p.src} alt="" /></div>
          {p.caption ? <div className="cap">✿ {p.caption}</div> : null}
        </div>
      ))}
    </div>
  );
}

function PageFoot({ info, name, page }) {
  return (
    <div className="page-foot">
      <span>{info.centerName || ''}</span>
      <span>{name}의 성장 기록</span>
      <span>{page} / 04</span>
    </div>
  );
}

function ReportSheets({ info, result, photos }) {
  const name = info.childName || '○○';
  const band = (
    <div className="rep-band">
      <span>GROWTH &amp; DEVELOPMENT REPORT</span>
      <span>{info.period || '1학기'}</span>
    </div>
  );

  return (
    <>
      {/* 1쪽 — 표지 */}
      <div className="sheet">
        <div className="sheet-inner cover">
          <div className="cover-top">{info.centerName || '어린이집'}</div>
          <div className="cover-en">GROWTH &amp; DEVELOPMENT REPORT</div>
          <h1>한 학기 성장 보고서</h1>
          <div className="cover-period">{info.period || '1학기'}</div>
          <div className="cover-photo-mat">
            <div className="inner">
              {info.coverPhoto ? <img src={info.coverPhoto} alt="" /> : <span className="placeholder">🌷</span>}
            </div>
          </div>
          <div className="child-name">{name}</div>
          <div className="cover-info-table">
            <div className="row"><span className="k">소속 반</span><span className="v">{info.className || ''}</span></div>
            <div className="row"><span className="k">담임 교사</span><span className="v">{info.teacherName ? `${info.teacherName} 선생님` : ''}</span></div>
            <div className="row"><span className="k">기록 기간</span><span className="v">{info.period || ''}</span></div>
          </div>
          <div className="center-name">{info.centerName || ''}</div>
        </div>
      </div>

      {/* 2쪽 — 발달 이야기 Ⅰ */}
      <div className="sheet">
        <div className="sheet-inner">
          {band}
          <div className="page-head">
            <h3>{name}의 성장 발달 이야기 Ⅰ</h3>
            <div className="head-sub">한 학기 동안 선생님이 곁에서 지켜본 우리 아이의 모습입니다.</div>
          </div>
          <div className="area-list">
            <Section k="march" text={result.march} />
            <Section k="worry" text={result.worry} />
            <Section k="food" text={result.food} />
          </div>
          <PhotoBand items={[photos[0], photos[1]]} />
          <PageFoot info={info} name={name} page="02" />
        </div>
      </div>

      {/* 3쪽 — 발달 이야기 Ⅱ */}
      <div className="sheet">
        <div className="sheet-inner">
          {band}
          <div className="page-head">
            <h3>{name}의 성장 발달 이야기 Ⅱ</h3>
            <div className="head-sub">놀이와 관계 속에서 자라나는 모습을 담았습니다.</div>
          </div>
          <div className="area-list">
            <Section k="play" text={result.play} />
            <Section k="topic" text={result.topic} />
            <Section k="friend" text={result.friend} />
          </div>
          <PhotoBand items={[photos[2], photos[3]]} />
          <PageFoot info={info} name={name} page="03" />
        </div>
      </div>

      {/* 4쪽 — 총평 · 편지 · 2학기 안내 */}
      <div className="sheet">
        <div className="sheet-inner">
          {band}
          <div className="page-head">
            <h3>선생님의 마음</h3>
            <div className="head-sub">한 학기의 총평과 다음 학기 안내를 전해 드립니다.</div>
          </div>
          <div className="page4-body">
            {result.grow && result.grow.trim() ? (
              <div className="grow-box">
                <div className="g-title">한 학기 총평 — 가장 큰 변화</div>
                <p>{result.grow}</p>
              </div>
            ) : null}
            {result.letter && result.letter.trim() ? (
              <div className="letter-box">
                <div className="letter-title">{name} 부모님께 드리는 편지</div>
                <p>{result.letter}</p>
                <div className="sign">{name}의 담임 {info.teacherName || ''} 드림</div>
              </div>
            ) : null}
            {result.next && result.next.trim() ? (
              <div className="next-box">
                <div className="n-title">2학기 안내</div>
                <p>{result.next}</p>
              </div>
            ) : null}
          </div>
          <PageFoot info={info} name={name} page="04" />
        </div>
      </div>
    </>
  );
}
