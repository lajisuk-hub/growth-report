// 인터뷰 답변 → 성장 보고서 문장 다듬기 (Claude API)
// 필요한 환경변수: ANTHROPIC_API_KEY

export const maxDuration = 60;

// AI가 준 JSON에서 따옴표 문제 등을 보정해서 파싱 (wmentor-journal 검증된 패턴)
function parseAiJson(raw) {
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('AI 응답에서 결과를 찾지 못했습니다');
  const text = jsonMatch[0];
  try { return JSON.parse(text); } catch (e) { /* 보정 후 재시도 */ }
  return JSON.parse(repairAiJson(text));
}

function repairAiJson(s) {
  let out = '';
  let inStr = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (!inStr) {
      if (c === '"') inStr = true;
      out += c;
      continue;
    }
    if (c === '\\') { out += c + (s[i + 1] || ''); i++; continue; }
    if (c === '\n') { out += '\\n'; continue; }
    if (c === '\r') { out += '\\r'; continue; }
    if (c === '\t') { out += '\\t'; continue; }
    if (c === '"') {
      let j = i + 1;
      while (j < s.length && /\s/.test(s[j])) j++;
      const n = s[j];
      if (n === ',' || n === '}' || n === ']' || n === ':' || j >= s.length) { inStr = false; out += c; }
      else out += '\\"';
      continue;
    }
    out += c;
  }
  return out;
}

const SYSTEM = `당신은 어린이집 교사의 짧은 메모를 학부모께 배부하는 1학기 성장 보고서 문장으로 다듬는 전문가입니다.

문체 규칙:
- 따뜻하고 품위 있는 존댓말로 씁니다. 학부모가 읽고 미소 짓게 되는 글이어야 합니다.
- 아이 이름을 자연스럽게 넣되, 조사(이는/는, 이가/가)를 이름 받침에 맞게 정확히 씁니다.
- 교사가 준 메모의 사실만 사용하고, 없는 일을 지어내지 않습니다. 메모를 매끄러운 문장으로 확장하는 것은 좋습니다.
- 각 영역은 2~3문장, 선생님의 편지(letter)는 5~7문장으로 씁니다.
- 큰따옴표(")는 절대 사용하지 않습니다. 아이의 말을 인용할 때도 따옴표 없이 풀어 씁니다.
- 부정적인 내용은 성장 중인 모습으로 부드럽게 표현합니다.

출력 규칙:
- 반드시 아래 키를 가진 JSON 하나만 출력합니다. 다른 말은 쓰지 않습니다.
- 해당 인터뷰 답변이 비어 있으면 그 키는 빈 문자열로 둡니다.
{
  "daily": "기본생활습관(식사, 스스로 하기 등)",
  "body": "신체운동과 건강",
  "talk": "의사소통(말하기, 듣기, 책)",
  "friend": "사회관계(친구, 선생님과의 관계)",
  "art": "예술경험(그리기, 노래, 율동)",
  "nature": "자연탐구(호기심, 탐색)",
  "play": "요즘 푹 빠진 놀이 이야기",
  "grow": "1학기 동안 자란 점 요약",
  "letter": "선생님이 학부모께 보내는 편지",
  "next": "2학기 안내를 다듬은 글 (2~4문장)"
}`;

export async function POST(request) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return Response.json({ error: 'API 키가 설정되지 않았습니다 (ANTHROPIC_API_KEY)' }, { status: 500 });
    }

    const { info, interview } = await request.json();
    if (!info?.childName) {
      return Response.json({ error: '아이 이름을 먼저 입력해 주세요' }, { status: 400 });
    }

    const lines = [
      `아이 이름: ${info.childName}`,
      `반 이름: ${info.className || ''}`,
      `담임: ${info.teacherName || ''}`,
      `기간: ${info.period || '1학기'}`,
      '',
      '--- 교사 인터뷰 메모 ---',
      `[식사와 스스로 하기] ${interview.daily || ''}`,
      `[신체운동, 건강] ${interview.body || ''}`,
      `[말하기, 듣기, 책] ${interview.talk || ''}`,
      `[친구 관계] ${interview.friend || ''}`,
      `[예술 (그리기, 노래, 율동)] ${interview.art || ''}`,
      `[자연탐구, 호기심] ${interview.nature || ''}`,
      `[요즘 푹 빠진 놀이] ${interview.play || ''}`,
      `[1학기 동안 가장 자란 점] ${interview.grow || ''}`,
      `[부모님께 전하고 싶은 말] ${interview.letter || ''}`,
      `[2학기 계획, 행사 안내] ${interview.next || ''}`,
    ];

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-5',
        max_tokens: 3000,
        system: SYSTEM,
        messages: [{ role: 'user', content: lines.join('\n') }],
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      return Response.json({ error: data.error?.message || 'AI 서버 오류' }, { status: res.status });
    }

    const text = (data.content || []).map((b) => b.text || '').join('\n');
    if (process.env.NODE_ENV !== 'production') {
      console.log('AI raw response:', JSON.stringify(data).slice(0, 2000));
    }
    const parsed = parseAiJson(text);
    return Response.json({ result: parsed });
  } catch (err) {
    return Response.json({ error: err.message || '알 수 없는 오류' }, { status: 500 });
  }
}
