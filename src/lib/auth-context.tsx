import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session, User } from "@supabase/supabase-js";

export type AppRole =
  | "admin"
  | "teacher"
  | "principal"
  | "assistant_principal"
  | "learning_specialist"
  | "leading_teacher"
  | "ot"
  | "slp"
  | "physio"
  | "aha"
  | "psychologist"
  | "behaviour_specialist"
  | "nurse"
  | "wellbeing_officer"
  | "attendance_officer"
  | "it_admin";

export type RoleGroup = "teacher" | "leadership" | "allied_health" | "wellbeing" | "it";

const GROUP_MAP: Record<RoleGroup, AppRole[]> = {
  teacher: ["teacher"],
  leadership: [
    "admin",
    "principal",
    "assistant_principal",
    "learning_specialist",
    "leading_teacher",
  ],
  allied_health: ["ot", "slp", "physio", "aha", "psychologist", "behaviour_specialist"],
  wellbeing: ["nurse", "wellbeing_officer", "attendance_officer"],
  it: ["it_admin", "admin"],
};

type Profile = {
  id: string;
  display_name: string | null;
  primary_group: RoleGroup;
  avatar_hue: number;
};

type AuthState = {
  ready: boolean;
  user: User | null;
  session: Session | null;
  roles: AppRole[];
  profile: Profile | null;
  hasRole: (r: AppRole) => boolean;
  inGroup: (g: RoleGroup) => boolean;
  isAdminPortalUser: boolean;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthCtx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);

  const loadRoleData = async (uid: string) => {
    const [rolesRes, profileRes] = await Promise.all([
      supabase.from("user_roles").select("role").eq("user_id", uid),
      supabase.from("profiles").select("*").eq("id", uid).maybeSingle(),
    ]);
    if (rolesRes.error) {
      // Surface this instead of silently pretending the user is a plain
      // teacher — a transient failure here should never quietly downgrade
      // (or upgrade) what portal/role UI someone sees.
      console.error("[auth] Failed to load user roles:", rolesRes.error.message);
    }
    const rs = (rolesRes.data ?? []).map((r: { role: AppRole }) => r.role);
    // Only fall back to "teacher" when the query actually succeeded and
    // simply returned no rows (a genuinely new/roleless account). On error,
    // leave roles empty rather than guessing — group checks (isAdminPortalUser
    // etc.) will correctly treat that as "unknown", not "confirmed teacher".
    setRoles(rs.length ? rs : rolesRes.error ? [] : ["teacher"]);
    if (profileRes.error) {
      console.error("[auth] Failed to load profile:", profileRes.error.message);
    }
    setProfile((profileRes.data as Profile | null) ?? null);
  };

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session ?? null);
      if (data.session?.user) {
        loadRoleData(data.session.user.id).finally(() => setReady(true));
      } else {
        setReady(true);
      }
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (s?.user) {
        loadRoleData(s.user.id);
      } else {
        setRoles([]);
        setProfile(null);
      }
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthState>(() => {
    const hasRole = (r: AppRole) => roles.includes(r);
    const inGroup = (g: RoleGroup) => roles.some((r) => GROUP_MAP[g].includes(r));
    const isAdminPortalUser =
      inGroup("leadership") || inGroup("allied_health") || inGroup("wellbeing") || inGroup("it");
    return {
      ready,
      user: session?.user ?? null,
      session,
      roles,
      profile,
      hasRole,
      inGroup,
      isAdminPortalUser,
      signOut: async () => {
        await supabase.auth.signOut();
      },
      refresh: async () => {
        if (session?.user) await loadRoleData(session.user.id);
      },
    };
  }, [ready, session, roles, profile]);

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function roleLabel(role: AppRole): string {
  const map: Record<AppRole, string> = {
    admin: "Administrator",
    teacher: "Teacher",
    principal: "Principal",
    assistant_principal: "Assistant Principal",
    learning_specialist: "Learning Specialist",
    leading_teacher: "Leading Teacher",
    ot: "Occupational Therapist",
    slp: "Speech Pathologist",
    physio: "Physiotherapist",
    aha: "Allied Health Assistant",
    psychologist: "Psychologist",
    behaviour_specialist: "Behaviour Specialist",
    nurse: "School Nurse",
    wellbeing_officer: "Wellbeing Officer",
    attendance_officer: "Attendance Officer",
    it_admin: "IT Administrator",
  };
  return map[role] ?? role;
}
