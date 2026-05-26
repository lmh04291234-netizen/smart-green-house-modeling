"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import {
  ExternalLink,
  LayoutGrid,
  LogIn,
  LogOut,
  Pencil,
  Plus,
  Save,
  Trash2,
  X
} from "lucide-react";
import Link from "next/link";
import {
  googleHostedDomain,
  isSchoolUser,
  isValidHttpUrl,
  normalizeUrl,
  schoolDomain
} from "@/lib/auth";
import { Assignment, AssignmentInput, isSupabaseConfigured, supabase } from "@/lib/supabase";

const emptyForm: AssignmentInput = {
  title: "",
  description: "",
  service_url: ""
};

type PlatformPage = "home" | "login" | "submit" | "assignments";

type AssignmentPlatformProps = {
  page: PlatformPage;
};

export default function AssignmentPlatform({ page }: AssignmentPlatformProps) {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [form, setForm] = useState<AssignmentInput>(emptyForm);
  const [email, setEmail] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const canUpload = useMemo(() => isSchoolUser(user), [user]);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      setMessage("Supabase 프로젝트 URL과 anon key를 .env.local에 설정하면 로그인과 과제 목록이 동작합니다.");
      return;
    }

    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    loadAssignments();
    return () => subscription.unsubscribe();
  }, []);

  async function loadAssignments() {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from("assignments")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setMessage("과제 목록을 불러오지 못했습니다.");
    } else {
      setAssignments(data ?? []);
    }
    setLoading(false);
  }

  async function signInWithGoogle() {
    if (!isSupabaseConfigured) {
      setMessage("Supabase 실제 프로젝트 정보를 .env.local에 먼저 입력하세요.");
      return;
    }

    if (!schoolDomain) {
      setMessage("학교 이메일 도메인을 .env.local에 먼저 설정하세요.");
      return;
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        queryParams: {
          hd: googleHostedDomain
        },
        redirectTo: window.location.origin
      }
    });

    if (error) {
      setMessage(error.message);
    }
  }

  async function signInWithEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isSupabaseConfigured) {
      setMessage("Supabase 실제 프로젝트 정보를 .env.local에 먼저 입력하세요.");
      return;
    }

    const emailDomain = email.toLowerCase().split("@").at(-1);
    const isAllowedEmail =
      emailDomain === schoolDomain || Boolean(emailDomain?.endsWith(`.${schoolDomain}`));

    if (!isAllowedEmail) {
      setMessage(`충남대학교 이메일(${schoolDomain} 또는 하위 도메인)만 로그인할 수 있습니다.`);
      return;
    }

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin
      }
    });

    setMessage(error ? error.message : "메일함에서 로그인 링크를 확인하세요.");
  }

  async function signOut() {
    await supabase.auth.signOut();
    setEditingId(null);
    setForm(emptyForm);
  }

  function startEdit(assignment: Assignment) {
    setEditingId(assignment.id);
    setForm({
      title: assignment.title,
      description: assignment.description,
      service_url: assignment.service_url
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function saveAssignment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!user || !canUpload) {
      setMessage("학교 계정으로 로그인한 학생만 업로드할 수 있습니다.");
      return;
    }

    setSaving(true);
    setMessage("");

    const serviceUrl = normalizeUrl(form.service_url);
    if (!isValidHttpUrl(serviceUrl)) {
      setMessage("올바른 서비스 링크를 입력하세요.");
      setSaving(false);
      return;
    }

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      service_url: serviceUrl,
      owner_id: user.id,
      owner_email: user.email ?? null
    };

    const request = editingId
      ? supabase.from("assignments").update(payload).eq("id", editingId).eq("owner_id", user.id)
      : supabase.from("assignments").insert(payload);

    const { error } = await request;

    if (error) {
      setMessage(error.message);
    } else {
      setMessage(editingId ? "카드를 수정했습니다." : "새 과제를 업로드했습니다.");
      setEditingId(null);
      setForm(emptyForm);
      await loadAssignments();
    }

    setSaving(false);
  }

  async function deleteAssignment(id: string) {
    if (!user) {
      return;
    }

    const ok = window.confirm("이 과제 카드를 삭제할까요?");
    if (!ok) {
      return;
    }

    const { error } = await supabase
      .from("assignments")
      .delete()
      .eq("id", id)
      .eq("owner_id", user.id);

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("카드를 삭제했습니다.");
      await loadAssignments();
    }
  }

  return (
    <main>
      <header className="topbar">
        <div>
          <p className="eyebrow">스마트 온실 모델링 이론</p>
          <Link className="brandLink" href="/">
            <h1>농업 서비스 과제 공유 플랫폼</h1>
          </Link>
        </div>

        <div className="authPanel">
          <nav className="navLinks" aria-label="주요 메뉴">
            <Link className={page === "assignments" ? "active" : ""} href="/assignments">
              과제 확인
            </Link>
            <Link className={page === "submit" ? "active" : ""} href="/submit">
              과제 제출
            </Link>
            <Link className={page === "login" ? "active" : ""} href="/login">
              로그인
            </Link>
          </nav>
          {user ? (
            <>
              <span>{user.email}</span>
              <button className="iconText" onClick={signOut} type="button">
                <LogOut size={18} />
                로그아웃
              </button>
            </>
          ) : (
            <>
              <button className="iconText primary" onClick={signInWithGoogle} type="button">
                <LogIn size={18} />
                Google 로그인
              </button>
              <form className="emailLogin" onSubmit={signInWithEmail}>
                <input
                  aria-label="학교 이메일"
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="name@o.cnu.ac.kr"
                  type="email"
                  value={email}
                />
                <button aria-label="이메일 링크 받기" type="submit">
                  <LogIn size={18} />
                </button>
              </form>
            </>
          )}
        </div>
      </header>

      {page === "home" ? (
        <section className="intro">
          <div>
            <h2>학생들이 만든 농업 서비스를 한눈에 모아봅니다.</h2>
            <p>온실 환경 데이터, 생육 모델, 자동화 아이디어가 서비스 결과물로 이어지는 공간입니다.</p>
          </div>
          <div className="counter">
            <LayoutGrid size={20} />
            <strong>{assignments.length}</strong>
            <span>개 과제</span>
          </div>
        </section>
      ) : null}

      {page === "login" ? (
        <section className="intro focused">
          <div>
            <h2>충남대학교 이메일로 로그인</h2>
            <p>과제 제출은 cnu.ac.kr 또는 o.cnu.ac.kr 계정으로 로그인한 학생만 가능합니다.</p>
          </div>
        </section>
      ) : null}

      {page === "submit" ? (
        <section className="intro focused">
          <div>
            <h2>과제 제출</h2>
            <p>본인이 만든 농업 서비스의 제목, 설명, 외부 링크를 등록합니다.</p>
          </div>
        </section>
      ) : null}

      {page === "assignments" ? (
        <section className="intro">
          <div>
            <h2>과제 확인</h2>
            <p>업로드된 농업 서비스를 카드로 확인하고 외부 링크로 이동합니다.</p>
          </div>
          <div className="counter">
            <LayoutGrid size={20} />
            <strong>{assignments.length}</strong>
            <span>개 과제</span>
          </div>
        </section>
      ) : null}

      {page === "home" ? (
        <section className="homeActions">
          <Link href="/assignments">과제 확인하기</Link>
          <Link href="/submit">과제 제출하기</Link>
        </section>
      ) : null}

      {page === "login" && user ? (
        <section className="editor slim">
          <div>
            <h2>로그인 완료</h2>
            <p>{canUpload ? "이제 과제를 제출할 수 있습니다." : "학교 도메인 계정으로 다시 로그인하세요."}</p>
          </div>
          <div className="actions">
            <Link className="linkButton primary" href="/submit">
              과제 제출
            </Link>
            <Link className="linkButton" href="/assignments">
              과제 확인
            </Link>
          </div>
        </section>
      ) : null}

      {message ? <p className="notice">{message}</p> : null}

      {user && !canUpload ? (
        <p className="notice danger">
          현재 계정은 학교 도메인이 아니므로 업로드 권한이 없습니다.
        </p>
      ) : null}

      {(page === "submit" || editingId) && canUpload ? (
        <section className="editor">
          <div>
            <h2>{editingId ? "과제 카드 수정" : "과제 업로드"}</h2>
            <p>모델링 결과와 서비스 링크를 수업 포트폴리오로 남깁니다.</p>
          </div>
          <form onSubmit={saveAssignment}>
            <label>
              제목
              <input
                maxLength={80}
                onChange={(event) => setForm({ ...form, title: event.target.value })}
                placeholder="예: 토마토 생육 환경 예측 대시보드"
                required
                value={form.title}
              />
            </label>
            <label>
              설명
              <textarea
                maxLength={300}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
                placeholder="서비스가 해결하는 문제와 주요 기능을 적어주세요."
                required
                rows={4}
                value={form.description}
              />
            </label>
            <label>
              링크
              <input
                inputMode="url"
                onChange={(event) => setForm({ ...form, service_url: event.target.value })}
                placeholder="https://..."
                required
                type="text"
                value={form.service_url}
              />
            </label>
            <div className="actions">
              <button className="iconText primary" disabled={saving} type="submit">
                {editingId ? <Save size={18} /> : <Plus size={18} />}
                {saving ? "저장 중" : editingId ? "수정 저장" : "업로드"}
              </button>
              {editingId ? (
                <button className="iconText ghost" onClick={cancelEdit} type="button">
                  <X size={18} />
                  취소
                </button>
              ) : null}
            </div>
          </form>
        </section>
      ) : null}

      {page === "submit" && !user ? (
        <section className="emptyPanel">
          <p>과제를 제출하려면 먼저 로그인하세요.</p>
          <Link className="linkButton primary" href="/login">
            로그인 페이지로 이동
          </Link>
        </section>
      ) : null}

      {page === "home" || page === "assignments" ? (
        <section className="gridSection">
          <div className="sectionTitle">
            <h2>전체 과제</h2>
            <span>공유된 농업 서비스</span>
          </div>

          {loading ? <p className="empty">불러오는 중...</p> : null}

          {!loading && assignments.length === 0 ? (
            <p className="empty">아직 업로드된 과제가 없습니다.</p>
          ) : null}

          <div className="cardGrid">
            {assignments.map((assignment) => {
              const isOwner = user?.id === assignment.owner_id;
              return (
                <article className="assignmentCard" key={assignment.id}>
                  <a href={assignment.service_url} rel="noreferrer" target="_blank">
                    <div className="cardMeta">
                      <span>{assignment.owner_email ?? "학생"}</span>
                      <ExternalLink size={18} />
                    </div>
                    <h3>{assignment.title}</h3>
                    <p>{assignment.description}</p>
                  </a>
                  {isOwner ? (
                    <div className="cardActions">
                      <button aria-label="수정" onClick={() => startEdit(assignment)} type="button">
                        <Pencil size={17} />
                      </button>
                      <button aria-label="삭제" onClick={() => deleteAssignment(assignment.id)} type="button">
                        <Trash2 size={17} />
                      </button>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        </section>
      ) : null}
    </main>
  );
}
