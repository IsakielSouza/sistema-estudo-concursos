# Phase 1: Foundation Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold the Expo bare workflow project with all dependencies, folder structure, TypeScript/Biome config, SQLite database with all migrations, and navigation shell (Drawer + Tabs) with placeholder screens.

**Architecture:** Expo Router v6 with bare workflow mirroring `react-native-memory-game` structure. MVVM pattern throughout. SQLite initialized at app startup with all tables created via sequential migrations. Navigation shell provides public/private route groups with Drawer + Tab layout.

**Tech Stack:** Expo 54 bare, Expo Router v6, React Native 0.81.5, TypeScript 5.9, Biome, PNPM, expo-sqlite, Zustand v5, @react-navigation/drawer, @react-navigation/bottom-tabs, @gorhom/bottom-sheet, React Native Reanimated 3

**Spec:** `docs/superpowers/specs/2026-03-21-sistema-estudo-concursos-design.md`

---

## Reference Projects

Before starting, review these files for patterns to replicate:
- `react-native-memory-game/package.json` — dependency versions
- `react-native-memory-game/babel.config.js` — module resolver config
- `react-native-memory-game/biome.json` — biome config
- `react-native-memory-game/tsconfig.json` — path aliases
- `react-native-memory-game/src/app/_layout.tsx` — root layout pattern
- `react-native-memory-game/src/app/(private)/_layout.tsx` — private layout pattern
- `react-native-memory-game/src/shared/stores/auth.store.ts` — Zustand persist pattern
- `react-native-marketplace-app/src/shared/store/user-store.ts` — store pattern

---

## Task 1: Initialize Expo Bare Workflow Project

**Files:**
- Create: `concursos-app/` (new project directory inside `sistema-estudo-concursos/`)
- Create: `concursos-app/package.json`
- Create: `concursos-app/app.json`
- Create: `concursos-app/babel.config.js`
- Create: `concursos-app/tsconfig.json`
- Create: `concursos-app/biome.json`
- Create: `concursos-app/.gitignore`

- [ ] **Step 1: Create project with Expo CLI**

```bash
cd /Users/isakielsouza/projects/sistema-estudo-concursos
npx create-expo-app@latest concursos-app --template blank-typescript
cd concursos-app
```

- [ ] **Step 2: Eject to bare workflow**

```bash
npx expo prebuild --clean
```

Expected: `android/` and `ios/` folders created.

- [ ] **Step 3: Replace package.json with full dependency list**

```json
{
  "name": "concursos-app",
  "main": "expo-router/entry",
  "version": "1.0.0",
  "scripts": {
    "start": "expo start",
    "android": "expo run:android",
    "ios": "expo run:ios",
    "lint": "biome check src/",
    "format": "biome format --write src/"
  },
  "dependencies": {
    "@arthurrios/biome-config": "^1.1.4",
    "@biomejs/biome": "^2.3.14",
    "@expo-google-fonts/baloo-2": "^0.4.2",
    "@expo/vector-icons": "^15.0.3",
    "@gorhom/bottom-sheet": "^5.2.6",
    "@hookform/resolvers": "^5.2.2",
    "@react-native-async-storage/async-storage": "^2.2.0",
    "@react-navigation/bottom-tabs": "^7.4.0",
    "@react-navigation/drawer": "^7.3.0",
    "@react-navigation/elements": "^2.6.3",
    "@react-navigation/native": "^7.1.8",
    "@tanstack/react-query": "^5.89.0",
    "axios": "^1.12.2",
    "clsx": "^2.1.1",
    "date-fns": "^4.1.0",
    "expo": "~54.0.33",
    "expo-auth-session": "~6.0.3",
    "expo-background-fetch": "~13.0.5",
    "expo-blur": "~15.0.8",
    "expo-constants": "~18.0.13",
    "expo-file-system": "~18.0.12",
    "expo-font": "~14.0.11",
    "expo-haptics": "~15.0.8",
    "expo-image": "~3.0.11",
    "expo-linear-gradient": "~15.0.8",
    "expo-linking": "~8.0.11",
    "expo-notifications": "~0.32.16",
    "expo-router": "~6.0.23",
    "expo-splash-screen": "~31.0.13",
    "expo-sqlite": "~15.1.2",
    "expo-status-bar": "~3.0.9",
    "expo-system-ui": "~6.0.9",
    "expo-task-manager": "~12.0.6",
    "expo-web-browser": "~15.0.10",
    "react": "19.1.0",
    "react-dom": "19.1.0",
    "react-hook-form": "^7.63.0",
    "react-native": "0.81.5",
    "react-native-gesture-handler": "~2.28.0",
    "react-native-reanimated": "~3.17.0",
    "react-native-safe-area-context": "~5.6.0",
    "react-native-screens": "~4.16.0",
    "react-native-web": "~0.21.0",
    "react-native-worklets": "0.7.3",
    "yup": "^1.7.1",
    "zustand": "^5.0.11"
  },
  "devDependencies": {
    "@types/react": "~19.1.0",
    "babel-plugin-module-resolver": "^5.0.2",
    "typescript": "~5.9.2"
  },
  "private": true
}
```

- [ ] **Step 4: Install dependencies**

```bash
pnpm install
```

Expected: `node_modules/` populated, `pnpm-lock.yaml` created.

- [ ] **Step 5: Commit**

```bash
git add concursos-app/
git commit -m "chore: initialize expo bare workflow project with full dependencies"
```

---

## Task 2: Configure TypeScript, Biome, and Babel

**Files:**
- Modify: `concursos-app/tsconfig.json`
- Modify: `concursos-app/babel.config.js`
- Create: `concursos-app/biome.json`

- [ ] **Step 1: Configure tsconfig.json with path aliases**

Copy the pattern from `react-native-memory-game/tsconfig.json`. Replace contents of `concursos-app/tsconfig.json`:

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["**/*.ts", "**/*.tsx", ".expo/types/**/*.d.ts", "expo-env.d.ts"]
}
```

- [ ] **Step 2: Configure babel.config.js with module resolver**

```js
module.exports = function (api) {
  api.cache(true)
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./src'],
          alias: {
            '@': './src',
          },
        },
      ],
      'react-native-reanimated/plugin',
    ],
  }
}
```

- [ ] **Step 3: Configure biome.json**

Copy from `react-native-memory-game/biome.json` and adjust project name:

```json
{
  "$schema": "https://biomejs.dev/schemas/2.0.0/schema.json",
  "extends": ["@arthurrios/biome-config"],
  "files": {
    "ignore": ["node_modules", ".expo", "android", "ios"]
  }
}
```

- [ ] **Step 4: Verify lint runs**

```bash
cd concursos-app
pnpm lint
```

Expected: No errors (empty src/ at this point).

- [ ] **Step 5: Commit**

```bash
git add concursos-app/tsconfig.json concursos-app/babel.config.js concursos-app/biome.json
git commit -m "chore: configure typescript strict mode, path aliases, biome lint"
```

---

## Task 3: Create Full Folder Structure

**Files:**
- Create: all directories and `.gitkeep` files per spec section 3

- [ ] **Step 1: Create src folder structure**

```bash
cd concursos-app
mkdir -p src/app/\(public\)
mkdir -p src/app/\(private\)/\(tabs\)
mkdir -p src/screens/{Home,Cycle,Subject,Session,History,Backup,Settings,Login}/components
mkdir -p src/shared/api
mkdir -p src/shared/queries/{sheets,subjects,cycles,sessions}
mkdir -p src/shared/services
mkdir -p src/shared/database/migrations
mkdir -p src/shared/database/repositories
mkdir -p src/shared/hooks
mkdir -p src/shared/stores
mkdir -p src/shared/interfaces/http
mkdir -p src/shared/components/{AppText,AppButton,ProgressBar,TimerDisplay}
mkdir -p src/shared/helpers
mkdir -p src/shared/schemas
mkdir -p src/animations/{hooks,config}
mkdir -p src/constants
mkdir -p src/assets/images
```

- [ ] **Step 2: Create constants/colors.ts** (mirrors memory-game pattern)

```typescript
// src/constants/colors.ts
export const colors = {
  brand: {
    primary: '#4F6CF7',
    secondary: '#7B93FF',
  },
  status: {
    success: '#4CAF50',
    warning: '#FF9800',
    error: '#F44336',
    late: '#FF5722',
  },
  grayscale: {
    gray100: '#F5F5F5',
    gray200: '#EEEEEE',
    gray300: '#E0E0E0',
    gray400: '#BDBDBD',
    gray500: '#9E9E9E',
    gray600: '#757575',
    gray700: '#616161',
    gray800: '#424242',
    gray900: '#212121',
  },
  background: {
    primary: '#0F0F0F',
    card: '#1A1A1A',
    elevated: '#242424',
  },
} as const
```

- [ ] **Step 3: Commit**

```bash
git add concursos-app/src/
git commit -m "chore: create full folder structure and color constants"
```

---

## Task 4: SQLite Database Setup + All Migrations

**Files:**
- Create: `src/shared/database/database.ts`
- Create: `src/shared/database/migrations/001_initial.ts`
- Create: `src/shared/database/migrations/index.ts`

- [ ] **Step 1: Create database.ts**

```typescript
// src/shared/database/database.ts
import * as SQLite from 'expo-sqlite'
import { runMigrations } from './migrations'

let db: SQLite.SQLiteDatabase | null = null

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db
  db = await SQLite.openDatabaseAsync('concursos.db')
  await runMigrations(db)
  return db
}

export async function closeDatabase(): Promise<void> {
  if (db) {
    await db.closeAsync()
    db = null
  }
}
```

- [ ] **Step 2: Create migration 001_initial.ts with all tables**

```typescript
// src/shared/database/migrations/001_initial.ts
import type { SQLiteDatabase } from 'expo-sqlite'

export async function migration001(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS concursos (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      target_date TEXT,
      is_active INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS subjects (
      id TEXT PRIMARY KEY,
      concurso_id TEXT NOT NULL,
      name TEXT NOT NULL,
      points INTEGER NOT NULL DEFAULT 0,
      experience INTEGER NOT NULL DEFAULT 1,
      cycle_status TEXT NOT NULL DEFAULT 'active',
      is_slow_build INTEGER NOT NULL DEFAULT 0,
      is_free_study INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY (concurso_id) REFERENCES concursos(id)
    );

    CREATE TABLE IF NOT EXISTS topics (
      id TEXT PRIMARY KEY,
      subject_id TEXT NOT NULL,
      code TEXT NOT NULL,
      title TEXT NOT NULL,
      level INTEGER NOT NULL DEFAULT 1,
      "order" INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'pending',
      is_dirty INTEGER NOT NULL DEFAULT 0,
      local_updated_at TEXT,
      FOREIGN KEY (subject_id) REFERENCES subjects(id)
    );

    CREATE TABLE IF NOT EXISTS cycles (
      id TEXT PRIMARY KEY,
      concurso_id TEXT NOT NULL,
      name TEXT NOT NULL,
      cycle_number INTEGER NOT NULL DEFAULT 1,
      planned_hours REAL NOT NULL DEFAULT 0,
      completed_hours REAL NOT NULL DEFAULT 0,
      started_at TEXT NOT NULL,
      ended_at TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      FOREIGN KEY (concurso_id) REFERENCES concursos(id)
    );

    CREATE TABLE IF NOT EXISTS cycle_subjects (
      id TEXT PRIMARY KEY,
      cycle_id TEXT NOT NULL,
      subject_id TEXT NOT NULL,
      allocated_hours REAL NOT NULL DEFAULT 0,
      completed_hours REAL NOT NULL DEFAULT 0,
      FOREIGN KEY (cycle_id) REFERENCES cycles(id),
      FOREIGN KEY (subject_id) REFERENCES subjects(id)
    );

    CREATE TABLE IF NOT EXISTS planned_sessions (
      id TEXT PRIMARY KEY,
      cycle_subject_id TEXT NOT NULL,
      subject_id TEXT NOT NULL,
      cycle_id TEXT NOT NULL,
      position INTEGER NOT NULL DEFAULT 0,
      allocated_seconds INTEGER NOT NULL DEFAULT 7200,
      status TEXT NOT NULL DEFAULT 'pending',
      FOREIGN KEY (cycle_subject_id) REFERENCES cycle_subjects(id),
      FOREIGN KEY (subject_id) REFERENCES subjects(id),
      FOREIGN KEY (cycle_id) REFERENCES cycles(id)
    );

    CREATE TABLE IF NOT EXISTS study_sessions (
      id TEXT PRIMARY KEY,
      planned_session_id TEXT NOT NULL,
      cycle_subject_id TEXT NOT NULL,
      subject_id TEXT NOT NULL,
      started_at TEXT NOT NULL,
      ended_at TEXT,
      study_seconds INTEGER NOT NULL DEFAULT 0,
      review_seconds INTEGER NOT NULL DEFAULT 0,
      paused_seconds INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (planned_session_id) REFERENCES planned_sessions(id),
      FOREIGN KEY (cycle_subject_id) REFERENCES cycle_subjects(id),
      FOREIGN KEY (subject_id) REFERENCES subjects(id)
    );

    CREATE TABLE IF NOT EXISTS sync_log (
      id TEXT PRIMARY KEY,
      synced_at TEXT NOT NULL,
      spreadsheet_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'success',
      changes_count INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS migrations (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at TEXT NOT NULL
    );
  `)
}
```

- [ ] **Step 3: Create migrations/index.ts**

```typescript
// src/shared/database/migrations/index.ts
import type { SQLiteDatabase } from 'expo-sqlite'
import { migration001 } from './001_initial'

const MIGRATIONS = [
  { id: 1, name: '001_initial', fn: migration001 },
]

export async function runMigrations(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS migrations (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at TEXT NOT NULL
    );
  `)

  const applied = await db.getAllAsync<{ id: number }>(
    'SELECT id FROM migrations'
  )
  const appliedIds = new Set(applied.map((r) => r.id))

  for (const migration of MIGRATIONS) {
    if (!appliedIds.has(migration.id)) {
      await migration.fn(db)
      await db.runAsync(
        'INSERT INTO migrations (id, name, applied_at) VALUES (?, ?, ?)',
        [migration.id, migration.name, new Date().toISOString()]
      )
    }
  }
}
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd concursos-app
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add concursos-app/src/shared/database/
git commit -m "feat: add SQLite database setup with full schema migrations"
```

---

## Task 5: Zustand Stores

**Files:**
- Create: `src/shared/stores/auth.store.ts`
- Create: `src/shared/stores/cycle.store.ts`
- Create: `src/shared/stores/session.store.ts`
- Create: `src/shared/stores/settings.store.ts`

- [ ] **Step 1: Create auth.store.ts**

Pattern from `react-native-memory-game/src/shared/stores/auth.store.ts`:

```typescript
// src/shared/stores/auth.store.ts
import AsyncStorage from '@react-native-async-storage/async-storage'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

interface AuthUser {
  id: string
  name: string
  email: string
  photoUrl: string | null
}

interface AuthStore {
  user: AuthUser | null
  spreadsheetId: string | null
  googleAccessToken: string | null
  googleRefreshToken: string | null
  setUser: (user: AuthUser) => void
  setTokens: (access: string, refresh: string) => void
  setSpreadsheetId: (id: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      spreadsheetId: null,
      googleAccessToken: null,
      googleRefreshToken: null,
      setUser: (user) => set({ user }),
      setTokens: (googleAccessToken, googleRefreshToken) =>
        set({ googleAccessToken, googleRefreshToken }),
      setSpreadsheetId: (spreadsheetId) => set({ spreadsheetId }),
      logout: () =>
        set({
          user: null,
          googleAccessToken: null,
          googleRefreshToken: null,
        }),
    }),
    {
      name: '@concursos:auth',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
)
```

- [ ] **Step 2: Create cycle.store.ts**

```typescript
// src/shared/stores/cycle.store.ts
import AsyncStorage from '@react-native-async-storage/async-storage'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

interface CycleStore {
  activeCycleId: string | null
  activeConcursoId: string | null
  setActiveCycle: (cycleId: string, concursoId: string) => void
  clearActiveCycle: () => void
}

export const useCycleStore = create<CycleStore>()(
  persist(
    (set) => ({
      activeCycleId: null,
      activeConcursoId: null,
      setActiveCycle: (activeCycleId, activeConcursoId) =>
        set({ activeCycleId, activeConcursoId }),
      clearActiveCycle: () =>
        set({ activeCycleId: null, activeConcursoId: null }),
    }),
    {
      name: '@concursos:cycle',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
)
```

- [ ] **Step 3: Create session.store.ts**

```typescript
// src/shared/stores/session.store.ts
import AsyncStorage from '@react-native-async-storage/async-storage'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

interface SessionStore {
  activePlannedSessionId: string | null
  activeCycleSubjectId: string | null
  sessionStartTimestamp: number | null
  pausedAt: number | null
  pausedTotalMs: number
  isRunning: boolean
  includeReview: boolean
  startSession: (plannedSessionId: string, cycleSubjectId: string) => void
  pause: () => void
  resume: () => void
  setIncludeReview: (value: boolean) => void
  clearSession: () => void
}

export const useSessionStore = create<SessionStore>()(
  persist(
    (set, get) => ({
      activePlannedSessionId: null,
      activeCycleSubjectId: null,
      sessionStartTimestamp: null,
      pausedAt: null,
      pausedTotalMs: 0,
      isRunning: false,
      includeReview: true,
      startSession: (activePlannedSessionId, activeCycleSubjectId) =>
        set({
          activePlannedSessionId,
          activeCycleSubjectId,
          sessionStartTimestamp: Date.now(),
          pausedAt: null,
          pausedTotalMs: 0,
          isRunning: true,
        }),
      pause: () => {
        const { isRunning } = get()
        if (!isRunning) return
        set({ pausedAt: Date.now(), isRunning: false })
      },
      resume: () => {
        const { pausedAt, pausedTotalMs } = get()
        if (!pausedAt) return
        set({
          pausedTotalMs: pausedTotalMs + (Date.now() - pausedAt),
          pausedAt: null,
          isRunning: true,
        })
      },
      setIncludeReview: (includeReview) => set({ includeReview }),
      clearSession: () =>
        set({
          activePlannedSessionId: null,
          activeCycleSubjectId: null,
          sessionStartTimestamp: null,
          pausedAt: null,
          pausedTotalMs: 0,
          isRunning: false,
        }),
    }),
    {
      name: '@concursos:session',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
)
```

- [ ] **Step 4: Create settings.store.ts**

```typescript
// src/shared/stores/settings.store.ts
import AsyncStorage from '@react-native-async-storage/async-storage'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

interface SettingsStore {
  autoBackupEnabled: boolean
  setAutoBackup: (value: boolean) => void
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      autoBackupEnabled: false,
      setAutoBackup: (autoBackupEnabled) => set({ autoBackupEnabled }),
    }),
    {
      name: '@concursos:settings',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
)
```

- [ ] **Step 5: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 6: Commit**

```bash
git add concursos-app/src/shared/stores/
git commit -m "feat: add all Zustand stores (auth, cycle, session, settings)"
```

---

## Task 6: Navigation Shell (Drawer + Tabs + Placeholder Screens)

**Files:**
- Create: `src/app/index.tsx`
- Create: `src/app/_layout.tsx`
- Create: `src/app/(public)/_layout.tsx`
- Create: `src/app/(public)/login.tsx`
- Create: `src/app/(private)/_layout.tsx` (Drawer)
- Create: `src/app/(private)/(tabs)/_layout.tsx`
- Create: `src/app/(private)/(tabs)/home.tsx`
- Create: `src/app/(private)/(tabs)/cycle.tsx`
- Create: `src/app/(private)/subject/[id].tsx`
- Create: `src/app/(private)/session.tsx`
- Create: `src/app/(private)/history.tsx`
- Create: `src/app/(private)/backup.tsx`
- Create: `src/app/(private)/settings.tsx`
- Create: `src/screens/Login/Login.view.tsx`
- Create: `src/screens/Login/useLogin.viewModel.ts`
- Create: `src/screens/Home/Home.view.tsx`
- Create: `src/screens/Home/useHome.viewModel.ts`
- Create: `src/screens/Cycle/Cycle.view.tsx`
- Create: `src/screens/Cycle/useCycle.viewModel.ts`

- [ ] **Step 1: Create root index.tsx (redirect based on auth)**

```typescript
// src/app/index.tsx
import { useAuthStore } from '@/shared/stores/auth.store'
import { Redirect } from 'expo-router'

export default function Index() {
  const user = useAuthStore((s) => s.user)
  return <Redirect href={user ? '/(private)/(tabs)/home' : '/(public)/login'} />
}
```

- [ ] **Step 2: Create root _layout.tsx with QueryClient + GestureHandler**

```typescript
// src/app/_layout.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useFonts, Baloo2_800ExtraBold } from '@expo-google-fonts/baloo-2'
import { Stack } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { useEffect } from 'react'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { StyleSheet } from 'react-native'

SplashScreen.preventAutoHideAsync()

const queryClient = new QueryClient()

export default function RootLayout() {
  const [loaded] = useFonts({ Baloo2_800ExtraBold })

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync()
  }, [loaded])

  if (!loaded) return null

  return (
    <GestureHandlerRootView style={styles.root}>
      <QueryClientProvider client={queryClient}>
        <Stack screenOptions={{ headerShown: false }} />
      </QueryClientProvider>
    </GestureHandlerRootView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1 },
})
```

- [ ] **Step 3: Create public layout**

```typescript
// src/app/(public)/_layout.tsx
import { Stack } from 'expo-router'

export default function PublicLayout() {
  return <Stack screenOptions={{ headerShown: false }} />
}
```

- [ ] **Step 4: Create placeholder Login screen**

```typescript
// src/app/(public)/login.tsx
import { LoginView } from '@/screens/Login/Login.view'
export default LoginView
```

```typescript
// src/screens/Login/Login.view.tsx
import { colors } from '@/constants/colors'
import { StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export const LoginView = () => {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Sistema de Estudos</Text>
      <Text style={styles.subtitle}>Login — em breve</Text>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    color: colors.grayscale.gray100,
    fontFamily: 'Baloo2_800ExtraBold',
  },
  subtitle: {
    fontSize: 16,
    color: colors.grayscale.gray400,
    marginTop: 8,
  },
})
```

```typescript
// src/screens/Login/useLogin.viewModel.ts
export const useLoginViewModel = () => {
  return {}
}
```

- [ ] **Step 5: Create Drawer layout (private)**

```typescript
// src/app/(private)/_layout.tsx
import { Drawer } from 'expo-router/drawer'
import { colors } from '@/constants/colors'

export default function PrivateLayout() {
  return (
    <Drawer
      screenOptions={{
        headerShown: false,
        drawerStyle: { backgroundColor: colors.background.card },
        drawerActiveTintColor: colors.brand.primary,
        drawerInactiveTintColor: colors.grayscale.gray400,
      }}
    >
      <Drawer.Screen
        name="(tabs)"
        options={{ drawerLabel: 'Início', title: 'Início' }}
      />
      <Drawer.Screen
        name="history"
        options={{ drawerLabel: 'Histórico', title: 'Histórico' }}
      />
      <Drawer.Screen
        name="backup"
        options={{ drawerLabel: 'Backup', title: 'Backup' }}
      />
      <Drawer.Screen
        name="settings"
        options={{ drawerLabel: 'Configurações', title: 'Configurações' }}
      />
      <Drawer.Screen
        name="subject/[id]"
        options={{ drawerItemStyle: { display: 'none' } }}
      />
      <Drawer.Screen
        name="session"
        options={{ drawerItemStyle: { display: 'none' } }}
      />
    </Drawer>
  )
}
```

- [ ] **Step 6: Create Tab layout**

```typescript
// src/app/(private)/(tabs)/_layout.tsx
import { Tabs } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { colors } from '@/constants/colors'

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: colors.background.card },
        tabBarActiveTintColor: colors.brand.primary,
        tabBarInactiveTintColor: colors.grayscale.gray500,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="cycle"
        options={{
          title: 'Ciclo',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="repeat-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  )
}
```

- [ ] **Step 7: Create placeholder tab screens and stacks**

Create `src/app/(private)/(tabs)/home.tsx`:
```typescript
import { HomeView } from '@/screens/Home/Home.view'
export default HomeView
```

Create `src/screens/Home/Home.view.tsx` (placeholder):
```typescript
import { colors } from '@/constants/colors'
import { StyleSheet, Text } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
export const HomeView = () => (
  <SafeAreaView style={styles.container}>
    <Text style={styles.text}>Home — em breve</Text>
  </SafeAreaView>
)
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary, alignItems: 'center', justifyContent: 'center' },
  text: { color: colors.grayscale.gray100, fontSize: 18 },
})
```

Create `src/screens/Home/useHome.viewModel.ts`:
```typescript
export const useHomeViewModel = () => ({})
```

Repeat same placeholder pattern for:
- `src/app/(private)/(tabs)/cycle.tsx` → `src/screens/Cycle/Cycle.view.tsx` + `src/screens/Cycle/useCycle.viewModel.ts`
- `src/app/(private)/subject/[id].tsx` → `src/screens/Subject/Subject.view.tsx` + `src/screens/Subject/useSubject.viewModel.ts`
- `src/app/(private)/session.tsx` → `src/screens/Session/Session.view.tsx` + `src/screens/Session/useSession.viewModel.ts`
- `src/app/(private)/history.tsx` → `src/screens/History/History.view.tsx` + `src/screens/History/useHistory.viewModel.ts`
- `src/app/(private)/backup.tsx` → `src/screens/Backup/Backup.view.tsx` + `src/screens/Backup/useBackup.viewModel.ts`
- `src/app/(private)/settings.tsx` → `src/screens/Settings/Settings.view.tsx` + `src/screens/Settings/useSettings.viewModel.ts`

- [ ] **Step 8: Run on simulator to verify navigation shell works**

```bash
cd concursos-app
pnpm ios
# or
pnpm android
```

Expected: App opens on Login placeholder. No crashes.

- [ ] **Step 9: Commit**

```bash
git add concursos-app/src/app/ concursos-app/src/screens/
git commit -m "feat: add navigation shell — drawer, tabs, and placeholder screens"
```

---

## Phase 1 Complete

At this point you have:
- ✅ Expo bare workflow with all dependencies installed
- ✅ TypeScript strict, Biome, path aliases configured
- ✅ Full folder structure per spec
- ✅ SQLite database with all 8 tables (migrations)
- ✅ All 4 Zustand stores with persistence
- ✅ Navigation shell: Drawer (Histórico, Backup, Configurações) + Tab Bar (Home, Ciclo)
- ✅ Placeholder screens for all routes

**Next:** `docs/superpowers/plans/2026-03-21-phase-2-auth.md`
