-- ==============================================================================
-- 🚀 CampusBite (v1.5) - Schema SQL para Supabase (PostgreSQL + Auth + Realtime)
-- ==============================================================================
-- Instrucciones:
-- 1. Inicia sesión en https://supabase.com/dashboard y selecciona tu proyecto.
-- 2. Ve al menú lateral izquierdo -> "SQL Editor".
-- 3. Haz clic en "New query", pega este archivo completo y presiona "Run" (Ctrl+Enter).
-- 4. Copia tu URL y Anon Key desde: Project Settings -> API
-- 5. Agrégalas en Vercel (Settings -> Environment Variables) o en tu archivo .env local:
--    VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
--    VITE_SUPABASE_ANON_KEY=tu-llave-anon-publica
-- ==============================================================================

-- 1. TABLA: students (Estudiantes, Autenticación y Saldo de CampusPay)
CREATE TABLE IF NOT EXISTS public.students (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    wallet_balance NUMERIC NOT NULL DEFAULT 25000,
    transactions JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. TABLA: orders (Pedidos, Monitoreo KDS y Click & Collect)
CREATE TABLE IF NOT EXISTS public.orders (
    id TEXT PRIMARY KEY,
    student_name TEXT NOT NULL,
    student_id TEXT NOT NULL,
    notes TEXT,
    total_price NUMERIC NOT NULL,
    pickup_code TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'recibido',
    items JSONB DEFAULT '[]'::jsonb NOT NULL,
    location_id TEXT NOT NULL,
    location_name TEXT NOT NULL,
    pickup_type TEXT NOT NULL DEFAULT 'inmediato',
    scheduled_time TEXT,
    payment_method TEXT NOT NULL DEFAULT 'campus_wallet',
    is_paid BOOLEAN NOT NULL DEFAULT false,
    is_group_order BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. ÍNDICES DE RENDIMIENTO PARA CONSULTAS RÁPIDAS
CREATE INDEX IF NOT EXISTS idx_students_email ON public.students (lower(email));
CREATE INDEX IF NOT EXISTS idx_orders_student_id ON public.orders (student_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders (created_at DESC);

-- 4. HABILITACIÓN DE ROW LEVEL SECURITY (RLS)
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- 5. POLÍTICAS DE ACCESO PÚBLICO (ANON KEY)
-- Permite que la app frontend consulte y cree estudiantes y pedidos
DROP POLICY IF EXISTS "Public access for students" ON public.students;
CREATE POLICY "Public access for students" ON public.students
    FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Public access for orders" ON public.orders;
CREATE POLICY "Public access for orders" ON public.orders
    FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- 6. PUBLICACIÓN EN TIEMPO REAL (Supabase Realtime)
-- Permite que los estudiantes vean cambios de estado en cocina al instante
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;

-- 7. ESTUDIANTES SEMILLA (Cuentas Demo para Pruebas Inmediatas entre PC y Móvil)
INSERT INTO public.students (id, name, email, password, wallet_balance, transactions)
VALUES 
(
  'EST-2024-491',
  'Valentina Torres',
  'valentina@universidad.edu.co',
  '1234',
  45000,
  '[{"id":"tx-init-1","description":"Bono de bienvenida CampusPay","amount":45000,"date":"2026-03-01T10:00:00Z"}]'::jsonb
),
(
  'EST-2023-118',
  'Camilo Rodríguez',
  'camilo@universidad.edu.co',
  '1234',
  30000,
  '[{"id":"tx-init-2","description":"Recarga PSE Nequi","amount":30000,"date":"2026-03-01T11:30:00Z"}]'::jsonb
)
ON CONFLICT (email) DO NOTHING;
