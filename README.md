# 스마트 온실 모델링 과제 공유 플랫폼

학생들이 만든 농업 서비스를 카드 형태로 공유하는 Next.js + Supabase 웹앱입니다.

## 기능

- 외부 방문자는 로그인 없이 전체 과제 카드 열람
- 학생은 학교 이메일로 로그인 후 제목, 설명, 링크 업로드
- 카드 클릭 시 외부 서비스 링크로 이동
- 본인이 올린 카드만 수정 및 삭제
- Supabase RLS로 데이터베이스 권한 보호

## 실행 준비

1. 의존성 설치

```bash
npm install
```

2. 환경 변수 설정

`.env.local.example`을 참고해 `.env.local`을 만듭니다.

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
NEXT_PUBLIC_SCHOOL_EMAIL_DOMAIN=cnu.ac.kr
NEXT_PUBLIC_GOOGLE_HOSTED_DOMAIN=o.cnu.ac.kr
```

3. Supabase SQL 실행

Supabase Dashboard의 SQL Editor에서 [supabase/schema.sql](./supabase/schema.sql)을 실행합니다.
현재 설정은 충남대학교 이메일 도메인인 `cnu.ac.kr`과 `o.cnu.ac.kr` 같은 하위 도메인 기준입니다.

4. 인증 설정

Supabase Authentication에서 Email OTP 또는 Google Provider를 활성화합니다.
Google 로그인을 쓰는 경우 학교 Google Workspace 도메인과 Supabase redirect URL을 함께 설정하세요.

5. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:3000`으로 접속합니다.
